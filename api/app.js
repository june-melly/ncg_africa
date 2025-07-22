import cors from 'cors';
import express from 'express';
import bodyParser from 'body-parser';

import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data.json');

const app = express();

const PORT = 5000;

app.use(bodyParser.json());
app.use(cors({
<<<<<<< Updated upstream
  origin: 'http://localhost:3001',
=======
  origin: ['http://localhost:3000', 'https://localhost:3000'],
>>>>>>> Stashed changes
  credentials: true
}));

// api/app.js
// ... (existing code)

let dashboards = []; // To store mock dashboard data
let widgets = [];    // To store mock widget data
let nextDashboardId = 1;
let nextWidgetId = 1;

// Initial mock data for testing
dashboards.push({
    id: nextDashboardId++,
    name: 'Sample Dashboard 1',
    description: 'A pre-loaded dashboard for testing.',
    widgets: [], // This should be an array of widget objects if you want to pre-populate
    is_published: 'Draft',
    refreshInterval: 120,
    autoRefresh: 'on',
    last_modified: new Date()
});

// Add another sample dashboard
dashboards.push({
    id: nextDashboardId++,
    name: 'Sales Overview',
    description: 'Dashboard showing key sales metrics.',
    widgets: [], // Add mock widget objects here if needed
    is_published: 'Published',
    refreshInterval: 60,
    autoRefresh: 'on',
    last_modified: new Date()
});

// ... (rest of your code)
// api/app.js
// ... (existing code)

// Example of adding a widget directly to a dashboard's widgets array
dashboards.push({
    id: nextDashboardId++,
    name: 'Dashboard with Widgets',
    description: 'A dashboard pre-populated with some widgets.',
    widgets: [
        {
            id: `widget-${nextWidgetId++}`,
            type: 'text-header',
            title: 'Welcome to My Dashboard',
            content: 'Welcome to My Dashboard',
            position: { x: 20, y: 20 },
            size: { width: 400, height: 80 },
            fontSize: 32,
            hasData: true,
            lastUpdated: new Date()
        },
        {
            id: `widget-${nextWidgetId++}`,
            type: 'bar',
            title: 'Monthly Sales',
            apiEndpoint: 'Query A', // Link to a mock query
            refreshInterval: 30000,
            position: { x: 450, y: 20 },
            size: { width: 300, height: 250 },
            hasData: true,
            data: [ // Sample data for the chart
                { name: 'Jan', value: 120 },
                { name: 'Feb', value: 150 },
                { name: 'Mar', value: 90 }
            ],
            lastUpdated: new Date()
        }
    ],
    is_published: 'Draft',
    refreshInterval: 120,
    autoRefresh: 'on',
    last_modified: new Date()
});

// ... (rest of your code)




// Function to load data from the JSON file
const loadData = () => {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            const parsedData = JSON.parse(data);
            dashboards = parsedData.dashboards || [];
            widgets = parsedData.widgets || [];
            nextDashboardId = parsedData.nextDashboardId || 1;
            nextWidgetId = parsedData.nextWidgetId || 1;
            console.log('Data loaded from file.');
        } else {
            console.log('Data file not found, initializing with empty data.');
            dashboards = [];
            widgets = [];
            nextDashboardId = 1;
            nextWidgetId = 1;
        }
    } catch (error) {
        console.error('Error loading data from file:', error);
        // Fallback to empty data if loading fails
        dashboards = [];
        widgets = [];
        nextDashboardId = 1;
        nextWidgetId = 1;
    }
};

// Function to save data to the JSON file
const saveData = () => {
    try {
        const dataToSave = JSON.stringify({ dashboards, widgets, nextDashboardId, nextWidgetId }, null, 2);
        fs.writeFileSync(DATA_FILE, dataToSave, 'utf8');
        console.log('Data saved to file.');
    } catch (error) {
        console.error('Error saving data to file:', error);
    }
};

// Load data when the server starts
loadData();

 
 app.get('/testing_backend', (req,res)=>{
  try {
    console.log('tested')
    return res.status(200).json({message:"Successful backend test"})
  } catch (error) {
    console.log(`backend test ${error}`)
  }
 })

// API to receive form
app.post('/save-widget', async (req, res) => {
  const payload = req.body.payload || req.body;
  //  console.log(payload)


  if(!payload.title || payload.title === 'null' || !payload.selectedQuery || payload.selectedQuery === 'null'){
   return res.status(404).json({message:"all fields are required"})
  }
   


  try {
    let pool = await sql.connect(dbConfig);

    // Check if this is an update (has ID) or new widget
    if (payload.id) {
      // Update existing widget
      await pool.request()
        .input('Id', sql.NVarChar, payload.id)
        .input('Title', sql.NVarChar, payload.title)
        .input('ApiEndpoint', sql.NVarChar, payload.selectedQuery)
        .input('RefreshInterval', sql.Int, payload.refreshInterval)
        .input('FontSize', sql.Int, payload.fontSize || 24)
        .input('Content', sql.NVarChar, payload.content || '')
        .query(`
          UPDATE LogMonitoringWidgets 
          SET Title = @Title, ApiEndpoint = @ApiEndpoint, RefreshInterval = @RefreshInterval, 
              fontSizeInput = @FontSize, textContentInput = @Content
          WHERE Id = @Id
        `);
      
      res.status(200).json({ message: 'Widget updated successfully' });
    } else {
      // Check if widget with the same name already exists (for new widgets only)
      const checkResult = await pool.request()
       .input('Title', sql.NVarChar, payload.title)
        .query(`SELECT * FROM LogMonitoringWidgets WHERE Title = @Title`);

      if (checkResult.recordset.length > 0) {
        return res.status(400).json({ message: 'Widget with this name already exists' });
      }


      // Insert new widget
      await pool.request()
        .input('Title', sql.NVarChar, payload.title)
        .input('ApiEndpoint', sql.NVarChar, payload.selectedQuery)
        .input('RefreshInterval', sql.Int, payload.refreshInterval)
        .input('FontSize', sql.Int, payload.fontSize || 24)
        .input('Content', sql.NVarChar, payload.content || '')
        .query(`
          INSERT INTO LogMonitoringWidgets (Title, ApiEndpoint, RefreshInterval, fontSizeInput, textContentInput)
          VALUES (@Title, @ApiEndpoint, @RefreshInterval, @FontSize, @Content)
        `);
    }
    
    const savedQueryResult = await pool.request()
    .input('selectedQuery', sql.NVarChar, payload.selectedQuery)
    .query(`SELECT QueryText FROM SavedQueries WHERE Title = @selectedQuery`)
    


    const resultData = await pool.request()
    .query(savedQueryResult.recordset[0].QueryText)

  //  console.log( resultData)

    res.status(200).json({ 
      message: payload.id ? 'Widget updated successfully' : 'Data inserted successfully', 
      savedQuery: resultData.recordset
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

     saveData(); // Add this line
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
  // console.log(name, dashboardId)

  if (!name || !dashboardId) {
    return res.status(400).json({ message: 'Dashboard ID and new name are required' });
  }

  try {
    let pool = await sql.connect(dbConfig);

    // Check if another dashboard already uses the same name
    const existing = await pool.request()
      .input('name', sql.NVarChar, name)
      .query(`SELECT * FROM dashboards WHERE name = @name`);
      // console.log(existing.recordset.length )

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
// console.log({
//     name,
//     description,
//     widgets,
//     lastModified,
//     is_published ,
//     refreshInterval,  
//     autoRefresh  
//   })
// console.log({
//    dashboardId 
//   })
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




 app.get('/loadStoredQuery_old', async (req, res) => {
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

// api/app.js
// ... (existing code)

app.get('/loadStoredQuery', async (req, res) => {
  try {
    const mockQueries = [
      { Title: 'Query A', QueryText: 'SELECT * FROM mock_data_a' },
      { Title: 'Query B', QueryText: 'SELECT * FROM mock_data_b' },
      { Title: 'Query C', QueryText: 'SELECT * FROM mock_data_c' },
      // Add more mock queries here
      { Title: 'User Activity', QueryText: 'SELECT user, activity FROM user_logs' },
      { Title: 'Product Inventory', QueryText: 'SELECT product_name, stock_count FROM inventory' },
    ];
    res.status(200).json(mockQueries);
  } catch (error) {
    console.error('Error loading mock queries:', error);
    res.status(500).json({ error: 'Error loading mock queries' });
  }
});

// ... (rest of your code)


// Add the missing /api/query-data endpoint
app.post('/api/query-data', async (req, res) => {
  const { queryTitle } = req.body;

  if (!queryTitle) {
    return res.status(400).json({ 
      success: false, 
      message: 'queryTitle is required' 
    });
  }

  try {
    // Enhanced mock data based on query title
    let mockData = [];
    
    switch (queryTitle) {
      case 'Sales by Product':
        mockData = [
          { product_name: 'Laptop Pro', total_sales: 1299.99 },
          { product_name: 'Smartphone X', total_sales: 899.99 },
          { product_name: 'Tablet Air', total_sales: 599.99 },
          { product_name: 'Monitor 4K', total_sales: 399.99 },
          { product_name: 'Headphones Pro', total_sales: 199.99 }
        ];
        break;
        
      case 'Monthly Revenue':
        mockData = [
          { month: '2024-01', revenue: 45000 },
          { month: '2024-02', revenue: 52000 },
          { month: '2024-03', revenue: 48000 },
          { month: '2024-04', revenue: 61000 },
          { month: '2024-05', revenue: 58000 }
        ];
        break;
        
      case 'Top Performers':
        mockData = [
          { salesperson: 'John Smith', total_sales: 2850.97 },
          { salesperson: 'Sarah Johnson', total_sales: 2245.96 },
          { salesperson: 'Mike Chen', total_sales: 1964.97 },
          { salesperson: 'Emily Davis', total_sales: 1879.97 },
          { salesperson: 'David Wilson', total_sales: 599.99 }
        ];
        break;
        
      case 'Regional Analysis':
        mockData = [
          { region: 'North America', transactions: 6, total_sales: 3169.94 },
          { region: 'Europe', transactions: 2, total_sales: 629.98 },
          { region: 'Asia', transactions: 2, total_sales: 1534.98 }
        ];
        break;
        
      case 'User Engagement':
        mockData = [
          { device_type: 'Desktop', avg_views: 35.0, avg_duration: 2800.0 },
          { device_type: 'Mobile', avg_views: 11.5, avg_duration: 750.0 },
          { device_type: 'Tablet', avg_views: 8.0, avg_duration: 600.0 }
        ];
        break;
        
      case 'Transaction Health':
        mockData = [
          { transaction_type: 'Payment Processing', success_count: 985, failure_count: 15, success_rate: 98.5 },
          { transaction_type: 'User Authentication', success_count: 2485, failure_count: 15, success_rate: 99.4 },
          { transaction_type: 'Data Sync', success_count: 495, failure_count: 5, success_rate: 99.0 },
          { transaction_type: 'File Upload', success_count: 740, failure_count: 10, success_rate: 98.7 }
        ];
        break;
        
      default:
        // Default mock data for unknown queries
        mockData = [
          { name: 'Item A', value: 120 },
          { name: 'Item B', value: 85 },
          { name: 'Item C', value: 200 },
          { name: 'Item D', value: 150 },
          { name: 'Item E', value: 95 }
        ];
    }
    
    // Format data based on widget type
    let formattedData = mockData;
    if (widgetType === 'chart' || widgetType === 'bar' || widgetType === 'pie' || widgetType === 'donut' || widgetType === 'histogram') {
      formattedData = mockData.map((row, index) => {
        const keys = Object.keys(row);
        return {
          name: row[keys[0]] || `Item ${index + 1}`,
          value: parseFloat(row[keys[1]]) || 0
        };
      });
    }

    res.status(200).json({
      success: true,
      data: formattedData,
      queryTitle: queryTitle,
      executedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error in /api/query-data:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: err.message 
    });
  }
});

app.use((req, res) => {
  res.status(404).json({ message: 'Page not found' });
<<<<<<< Updated upstream
});

// Start HTTP server for local development
app.listen(PORT, '0.0.0.0', () => {
    console.log(`HTTP server running on port ${PORT}`);
});
=======
});
>>>>>>> Stashed changes
