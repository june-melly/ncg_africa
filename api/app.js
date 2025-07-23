import cors from 'cors';
import express from 'express';
import bodyParser from 'body-parser';
import sql from'mssql';
const app = express();

const PORT = 5000;
import dbConfig from './dbConfig.js';

app.use(bodyParser.json());
app.use(cors());



// API to receive form
app.post('/save-widget', async (req, res) => {
  const { payload} = req.body;



  if(payload.title =='null'|| payload.selectedQuery =='null'){
   return res.status(404).json({message:"all fields are required"})
  }



  try {
    let pool = await sql.connect(dbConfig);

    // Check if widget with the same name already exists
      const checkResult = await pool.request()
       .input('Title', sql.NVarChar, payload.title)
        .query(`SELECT * FROM LogMonitoringWidgets WHERE Title = @Title`);

      if (checkResult.recordset.length > 0) {
        return res.status(400).json({ message: 'Widget with this name already exists' });
      }


      await pool.request()
        .input('Title', sql.NVarChar, payload.title)
        .input('ApiEndpoint', sql.NVarChar, payload.selectedQuery)
        .input('RefreshInterval', sql.Int, payload.refreshInterval)
      .input('fontSizeInput', sql.Int, payload.fontSizeInput)
      .input('textContentInput', sql.NVarChar, payload.textContentInput)
        .query(`
          INSERT INTO LogMonitoringWidgets (Title, ApiEndpoint, RefreshInterval, fontSizeInput, textContentInput)
        VALUES (@Title, @ApiEndpoint, @RefreshInterval, @fontSizeInput, @textContentInput)
        `);

    const savedQueryResult = await pool.request()
    .input('selectedQuery', sql.NVarChar, payload.selectedQuery)
    .query(`SELECT QueryText FROM SavedQueries WHERE Title = @selectedQuery`)



    const resultData = await pool.request()
    .query(savedQueryResult.recordset[0].QueryText)

   console.log( resultData.recordset[0])

    res.status(200).json({
      message: payload.id ? 'Widget updated successfully' : 'Data inserted successfully',
      savedQuery: resultData.recordset[0]
    });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: payload.id ? 'Database update failed' : 'Database insertion failed' });
  }
});

app.post('/create-dashboard', async (req, res) => {
  const { name, description } = req.body;
   console.log({ name, description })

  try {
    let pool = await sql.connect(dbConfig);

    // Check if dashboard with the same name already exists
    const checkResult = await pool.request()
      .input('name', sql.NVarChar, name)
      .query(`SELECT * FROM dashboards WHERE name = @name`);

    if (checkResult.recordset.length > 0) {
      return res.status(400).json({ message: 'Dashboard with this name already exists' });
    }

    // Proceed to insert new dashboard
    await pool.request()
      .input('name', sql.NVarChar, name)
      .input('description', sql.NVarChar, description)
      .input('widgets', sql.NVarChar, JSON.stringify([]))
      .input('is_published', sql.NVarChar, "Draft")
      .input('refreshInterval', sql.Int, 120)
      .input('autoRefresh', sql.NVarChar, "on")
      .query(`
        INSERT INTO dashboards (name, description, widgets, is_published, refreshInterval, autoRefresh)
        VALUES (@name, @description, @widgets, @is_published, @refreshInterval, @autoRefresh)
      `);

     saveData(); 
    res.status(200).json({ message: 'Dashboard created successfully' });

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database insertion failed' });
  }
});


app.get('/alldashboards', async (req, res) => {
  try {
    let pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`SELECT * FROM dashboards`);

    res.status(200).json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      message: 'Database error'
    });
  }
});



app.get('/render/:id', async (req, res) => {
  const { id } = req.params;

  if (!Number.isInteger(Number(id))) {
    return res.status(400).send({ message: 'Invalid ID format' });
  }

  try {
    let pool = await sql.connect(dbConfig);

    const renderResult = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('SELECT * FROM dashboards WHERE ID = @id');

    if (renderResult.rowsAffected[0] > 0) {
      let dashboard = renderResult.recordset[0];

      // ✅ Parse widgets safely
      try {
        dashboard.widgets = JSON.parse(dashboard.widgets || '[]');
      } catch (e) {
        dashboard.widgets = [];
      }

      res.status(200).send({ data: dashboard });
    } else {
      res.status(404).send({ message: 'Dashboard not found or already deleted' });
    }
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).send({ error: err.message });
  }
});

app.put('/editdashboardname/:id', async (req, res) => {
  const dashboardId = req.params.id;
  const { name } = req.body;
  console.log(name, dashboardId)

  if (!name || !dashboardId) {
    return res.status(400).json({ message: 'Dashboard ID and new name are required' });
  }

  try {
    let pool = await sql.connect(dbConfig);

    // Check if another dashboard already uses the same name
    const existing = await pool.request()
      .input('name', sql.NVarChar, name)
      .query(`SELECT * FROM dashboards WHERE name = @name`);
      console.log(existing.recordset.length )

    if (existing.recordset.length > 0) {

      return res.status(400).json({ message: 'Another dashboard already has this name' });
    }

    // Update the dashboard name
    await pool.request()
      .input('id', sql.Int, dashboardId)
      .input('name', sql.NVarChar, name)
      .query(`UPDATE dashboards SET name = @name, last_modified = GETDATE() WHERE id = @id`);

    res.status(200).json({ message: 'Dashboard name updated successfully' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});




app.delete('/deletedahboard/:id', async (req, res) => {
   const { id } = req.params;

   try {


    let pool = await sql.connect(dbConfig);

    const deleteResult = await pool.request()
       .input('id', sql.Int, id)
       .query('DELETE FROM dashboards WHERE id = @id');

     if (deleteResult.rowsAffected[0] > 0) {

       res.status(200).send({message:'Dashboard deleted successfully'});
     } else {
       res.status(404).send({message:'Query not found or already deleted'});
     }
   } catch (err) {
     console.error("Error deleting dashboard:", err);
   res.status(500).send({ error: err.message });
   }
 });

 app.put('/editdashboardname/:id', async (req, res) => {
  const dashboardId = req.params.id;
  const {
    name,
    description,
    widgets,
    lastModified,
    is_published = false,
    refreshInterval = 0,
    autoRefresh = false
  } = req.body;
console.log({
    name,
    description,
    widgets,
    lastModified,
    is_published ,
    refreshInterval,  
    autoRefresh  
  })
console.log({
   dashboardId 
  })
  try {
    const pool = await sql.connect(dbConfig);

    const widgetsJson = JSON.stringify(widgets || []);

    await pool.request()
      .input('Id', sql.VarChar, dashboardId)
      .input('Name', sql.NVarChar, name)
      .input('Description', sql.NVarChar, description)
      .input('LastModified', sql.DateTime, new Date(lastModified))
      .input('Widgets', sql.NVarChar(sql.MAX), widgetsJson)
      .input('IsPublished', sql.Bit, is_published)
      .input('RefreshInterval', sql.Int, refreshInterval)
      .input('AutoRefresh', sql.Bit, autoRefresh)
      .query(`
        UPDATE [Dynatrace_API].[dbo].[dashboards]
        SET
          name = @Name,
          description = @Description,
          widgets = @Widgets,
          last_modified = @LastModified,
          is_published = @IsPublished,
          refreshInterval = @RefreshInterval,
          autoRefresh = @AutoRefresh
        WHERE id = @Id
      `);

    res.status(200).json({ message: 'Dashboard updated successfully' });
  } catch (err) {
    console.error('Error updating dashboard:', err);
    res.status(500).json({ message: 'Failed to update dashboard', error: err.message });
  }
});




 app.get('/loadStoredQuery', async (req, res) => {
  try {
    let pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .query(`SELECT * FROM SavedQueries`);


    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
    });
