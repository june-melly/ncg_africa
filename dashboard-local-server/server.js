import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(express.json());
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:3000'],
    credentials: true
}));

// Database connection
let db;

// Initialize database
async function initDatabase() {
    try {
        db = await open({
            filename: join(__dirname, 'dashboard.db'),
            driver: sqlite3.Database
        });

        console.log('Connected to SQLite database');

        // Create tables
        await createTables();
        await seedInitialData();

    } catch (error) {
        console.error('Database initialization error:', error);
        process.exit(1);
    }
}

// Create database tables
async function createTables() {
    try {
        // Dashboards table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS dashboards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                description TEXT,
                widgets TEXT DEFAULT '[]',
                is_published TEXT DEFAULT 'Draft',
                refresh_interval INTEGER DEFAULT 120,
                auto_refresh TEXT DEFAULT 'on',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_modified DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Widgets table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS widgets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                api_endpoint TEXT,
                refresh_interval INTEGER DEFAULT 30000,
                font_size INTEGER DEFAULT 24,
                text_content TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Saved queries table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS saved_queries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL UNIQUE,
                query_text TEXT NOT NULL,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_used DATETIME
            )
        `);

        // Sample data tables
        await db.exec(`
            CREATE TABLE IF NOT EXISTS sales_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_name TEXT NOT NULL,
                sales_amount DECIMAL(10,2),
                sale_date DATE,
                region TEXT,
                salesperson TEXT
            )
        `);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS user_analytics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                page_views INTEGER,
                session_duration INTEGER,
                bounce_rate DECIMAL(5,2),
                date_recorded DATE,
                device_type TEXT
            )
        `);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS transaction_monitoring (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transaction_type TEXT,
                total_transactions INTEGER,
                success_count INTEGER,
                failure_count INTEGER,
                last_error TEXT,
                error_streak INTEGER DEFAULT 0
            )
        `);

        console.log('Database tables created successfully');
    } catch (error) {
        console.error('Error creating tables:', error);
        throw error;
    }
}

// Seed initial data
async function seedInitialData() {
    try {
        // Check if data already exists
        const dashboardCount = await db.get('SELECT COUNT(*) as count FROM dashboards');
        if (dashboardCount.count > 0) {
            console.log('Database already has data, skipping seed');
            return;
        }

        console.log('Seeding database with sample data...');

        // Insert sample dashboards
        await db.run(`
            INSERT INTO dashboards (name, description, widgets, is_published) VALUES 
            ('Sales Overview', 'Dashboard showing key sales metrics and performance indicators', '[]', 'Published'),
            ('Marketing Analytics', 'Marketing campaign performance and user engagement metrics', '[]', 'Draft'),
            ('Financial Dashboard', 'Revenue, expenses, and financial KPIs tracking', '[]', 'Published')
        `);

        // Insert saved queries
        await db.run(`
            INSERT INTO saved_queries (title, query_text, description) VALUES 
            ('Sales by Product', 'SELECT product_name, SUM(sales_amount) as total_sales FROM sales_data GROUP BY product_name ORDER BY total_sales DESC', 'Total sales grouped by product'),
            ('Monthly Revenue', 'SELECT strftime("%Y-%m", sale_date) as month, SUM(sales_amount) as revenue FROM sales_data GROUP BY month ORDER BY month', 'Monthly revenue trends'),
            ('Top Performers', 'SELECT salesperson, SUM(sales_amount) as total_sales FROM sales_data GROUP BY salesperson ORDER BY total_sales DESC LIMIT 10', 'Top 10 sales performers'),
            ('Regional Analysis', 'SELECT region, COUNT(*) as transactions, SUM(sales_amount) as total_sales FROM sales_data GROUP BY region', 'Sales analysis by region'),
            ('User Engagement', 'SELECT device_type, AVG(page_views) as avg_views, AVG(session_duration) as avg_duration FROM user_analytics GROUP BY device_type', 'User engagement by device type'),
            ('Transaction Health', 'SELECT transaction_type, success_count, failure_count, (success_count * 100.0 / total_transactions) as success_rate FROM transaction_monitoring', 'Transaction success rates')
        `);

        // Insert sample sales data
        const salesData = [
            ['Laptop Pro', 1299.99, '2024-01-15', 'North America', 'John Smith'],
            ['Wireless Mouse', 29.99, '2024-01-16', 'Europe', 'Sarah Johnson'],
            ['Keyboard Mechanical', 149.99, '2024-01-17', 'Asia', 'Mike Chen'],
            ['Monitor 4K', 399.99, '2024-01-18', 'North America', 'Emily Davis'],
            ['Tablet Air', 599.99, '2024-01-19', 'Europe', 'David Wilson'],
            ['Smartphone X', 899.99, '2024-01-20', 'Asia', 'Lisa Wang'],
            ['Headphones Pro', 199.99, '2024-01-21', 'North America', 'John Smith'],
            ['Webcam HD', 79.99, '2024-01-22', 'Europe', 'Sarah Johnson'],
            ['Speaker Bluetooth', 89.99, '2024-01-23', 'Asia', 'Mike Chen'],
            ['Charger Wireless', 39.99, '2024-01-24', 'North America', 'Emily Davis']
        ];

        for (const [product, amount, date, region, salesperson] of salesData) {
            await db.run(
                'INSERT INTO sales_data (product_name, sales_amount, sale_date, region, salesperson) VALUES (?, ?, ?, ?, ?)',
                [product, amount, date, region, salesperson]
            );
        }

        // Insert user analytics data
        const analyticsData = [
            ['user_001', 25, 1800, 0.25, '2024-01-15', 'Desktop'],
            ['user_002', 15, 900, 0.40, '2024-01-15', 'Mobile'],
            ['user_003', 35, 2400, 0.15, '2024-01-16', 'Desktop'],
            ['user_004', 8, 600, 0.60, '2024-01-16', 'Tablet'],
            ['user_005', 42, 3200, 0.10, '2024-01-17', 'Desktop']
        ];

        for (const [userId, views, duration, bounce, date, device] of analyticsData) {
            await db.run(
                'INSERT INTO user_analytics (user_id, page_views, session_duration, bounce_rate, date_recorded, device_type) VALUES (?, ?, ?, ?, ?, ?)',
                [userId, views, duration, bounce, date, device]
            );
        }

        // Insert transaction monitoring data
        const transactionData = [
            ['Payment Processing', 1000, 985, 15, 'Connection timeout', 2],
            ['User Authentication', 2500, 2485, 15, 'Invalid credentials', 1],
            ['Data Sync', 500, 495, 5, 'Network error', 0],
            ['File Upload', 750, 740, 10, 'File size exceeded', 1]
        ];

        for (const [type, total, success, failure, error, streak] of transactionData) {
            await db.run(
                'INSERT INTO transaction_monitoring (transaction_type, total_transactions, success_count, failure_count, last_error, error_streak) VALUES (?, ?, ?, ?, ?, ?)',
                [type, total, success, failure, error, streak]
            );
        }

        console.log('Database seeded successfully');
    } catch (error) {
        console.error('Error seeding database:', error);
        throw error;
    }
}

// API Routes

// Health check
app.get('/testing_backend', (req, res) => {
    res.json({ message: 'Successful backend test' });
});

// Get all dashboards
app.get('/alldashboards', async (req, res) => {
    try {
        const dashboards = await db.all('SELECT * FROM dashboards ORDER BY last_modified DESC');
        
        // Parse widgets JSON for each dashboard
        const processedDashboards = dashboards.map(dashboard => ({
            ...dashboard,
            widgets: JSON.parse(dashboard.widgets || '[]')
        }));

        res.json({
            success: true,
            data: processedDashboards
        });
    } catch (error) {
        console.error('Error fetching dashboards:', error);
        res.status(500).json({
            success: false,
            message: 'Database error'
        });
    }
});

// Get specific dashboard
app.get('/render/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const dashboard = await db.get('SELECT * FROM dashboards WHERE id = ?', [id]);
        
        if (dashboard) {
            // Parse widgets JSON
            dashboard.widgets = JSON.parse(dashboard.widgets || '[]');
            res.json({ data: dashboard });
        } else {
            res.status(404).json({ message: 'Dashboard not found' });
        }
    } catch (error) {
        console.error('Error fetching dashboard:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create new dashboard
app.post('/create-dashboard', async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Dashboard name is required' });
    }

    try {
        // Check if dashboard with same name exists
        const existing = await db.get('SELECT id FROM dashboards WHERE name = ?', [name]);
        if (existing) {
            return res.status(400).json({ message: 'Dashboard with this name already exists' });
        }

        // Insert new dashboard
        const result = await db.run(
            'INSERT INTO dashboards (name, description, widgets) VALUES (?, ?, ?)',
            [name, description || '', '[]']
        );

        res.json({
            message: 'Dashboard created successfully',
            id: result.lastID,
            name: name,
            description: description || ''
        });
    } catch (error) {
        console.error('Error creating dashboard:', error);
        res.status(500).json({ error: 'Database insertion failed' });
    }
});

// Update dashboard
app.put('/editdashboardname/:id', async (req, res) => {
    const dashboardId = req.params.id;
    const { name, description, widgets, lastModified, is_published, refreshInterval, autoRefresh } = req.body;

    try {
        // If only updating name
        if (name && !widgets) {
            const existing = await db.get('SELECT id FROM dashboards WHERE name = ? AND id != ?', [name, dashboardId]);
            if (existing) {
                return res.status(400).json({ message: 'Another dashboard already has this name' });
            }

            await db.run(
                'UPDATE dashboards SET name = ?, last_modified = CURRENT_TIMESTAMP WHERE id = ?',
                [name, dashboardId]
            );
        } else {
            // Full dashboard update
            const widgetsJson = JSON.stringify(widgets || []);
            
            await db.run(`
                UPDATE dashboards SET 
                    name = ?, 
                    description = ?, 
                    widgets = ?, 
                    last_modified = CURRENT_TIMESTAMP,
                    is_published = ?,
                    refresh_interval = ?,
                    auto_refresh = ?
                WHERE id = ?
            `, [name, description, widgetsJson, is_published || 'Draft', refreshInterval || 120, autoRefresh ? 'on' : 'off', dashboardId]);
        }

        res.json({ message: 'Dashboard updated successfully' });
    } catch (error) {
        console.error('Error updating dashboard:', error);
        res.status(500).json({ message: 'Failed to update dashboard' });
    }
});

// Delete dashboard
app.delete('/deletedahboard/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.run('DELETE FROM dashboards WHERE id = ?', [id]);
        
        if (result.changes > 0) {
            res.json({ message: 'Dashboard deleted successfully' });
        } else {
            res.status(404).json({ message: 'Dashboard not found' });
        }
    } catch (error) {
        console.error('Error deleting dashboard:', error);
        res.status(500).json({ error: error.message });
    }
});

// Save widget
app.post('/save-widget', async (req, res) => {
    const { title, apiEndpoint, refreshInterval, fontSizeInput, textContentInput } = req.body;

    if (!title) {
        return res.status(400).json({ message: 'Widget title is required' });
    }

    try {
        await db.run(
            'INSERT INTO widgets (title, api_endpoint, refresh_interval, font_size, text_content) VALUES (?, ?, ?, ?, ?)',
            [title, apiEndpoint || '', refreshInterval || 30000, fontSizeInput || 24, textContentInput || '']
        );

        res.json({ message: 'Widget saved successfully' });
    } catch (error) {
        console.error('Error saving widget:', error);
        res.status(500).json({ error: 'Failed to save widget' });
    }
});

// Get saved queries
app.get('/loadStoredQuery', async (req, res) => {
    try {
        const queries = await db.all('SELECT title, query_text, description FROM saved_queries ORDER BY title');
        res.json(queries.map(q => ({ Title: q.title, QueryText: q.query_text, Description: q.description })));
    } catch (error) {
        console.error('Error loading queries:', error);
        res.status(500).json({ error: 'Failed to load queries' });
    }
});

// Execute query and return data
app.post('/api/query-data', async (req, res) => {
    const { queryTitle, widgetType } = req.body;

    try {
        // Get the query
        const savedQuery = await db.get('SELECT query_text FROM saved_queries WHERE title = ?', [queryTitle]);
        
        if (!savedQuery) {
            return res.status(404).json({ error: 'Query not found' });
        }

        // Execute the query
        const results = await db.all(savedQuery.query_text);
        
        // Update last_used timestamp
        await db.run('UPDATE saved_queries SET last_used = CURRENT_TIMESTAMP WHERE title = ?', [queryTitle]);

        // Format data based on widget type
        let formattedData = results;
        if (widgetType === 'chart' || widgetType === 'bar' || widgetType === 'pie' || widgetType === 'donut') {
            formattedData = results.map((row, index) => {
                const keys = Object.keys(row);
                return {
                    name: row[keys[0]] || `Item ${index + 1}`,
                    value: parseFloat(row[keys[1]]) || 0
                };
            });
        }

        res.json({
            success: true,
            data: formattedData,
            queryTitle: queryTitle,
            executedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).json({ error: 'Failed to execute query' });
    }
});

// Sample data endpoints
app.get('/api/sample-data/sales', async (req, res) => {
    try {
        const data = await db.all('SELECT * FROM sales_data ORDER BY sale_date DESC LIMIT 50');
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch sales data' });
    }
});

app.get('/api/sample-data/analytics', async (req, res) => {
    try {
        const data = await db.all('SELECT * FROM user_analytics ORDER BY date_recorded DESC LIMIT 50');
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
});

app.get('/api/sample-data/transactions', async (req, res) => {
    try {
        const data = await db.all('SELECT * FROM transaction_monitoring');
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch transaction data' });
    }
});

// Publish/Unpublish dashboard
app.post('/api/dashboards/publish', async (req, res) => {
    const { dashboardId } = req.body;

    try {
        await db.run(
            'UPDATE dashboards SET is_published = ?, last_modified = CURRENT_TIMESTAMP WHERE id = ?',
            ['Published', dashboardId]
        );
        res.json({ message: 'Dashboard published successfully' });
    } catch (error) {
        console.error('Error publishing dashboard:', error);
        res.status(500).json({ error: 'Failed to publish dashboard' });
    }
});

app.post('/api/dashboards/:id/unpublish', async (req, res) => {
    const { id } = req.params;

    try {
        await db.run(
            'UPDATE dashboards SET is_published = ?, last_modified = CURRENT_TIMESTAMP WHERE id = ?',
            ['Draft', id]
        );
        res.json({ message: 'Dashboard unpublished successfully' });
    } catch (error) {
        console.error('Error unpublishing dashboard:', error);
        res.status(500).json({ error: 'Failed to unpublish dashboard' });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Endpoint not found' });
});

// Error handler
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Initialize database and start server
initDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Local development server running on http://localhost:${PORT}`);
        console.log(`📊 Database: SQLite (dashboard.db)`);
        console.log(`🔗 API Base URL: http://localhost:${PORT}`);
        console.log(`\n📋 Available endpoints:`);
        console.log(`   GET  /testing_backend - Health check`);
        console.log(`   GET  /alldashboards - Get all dashboards`);
        console.log(`   GET  /render/:id - Get specific dashboard`);
        console.log(`   POST /create-dashboard - Create new dashboard`);
        console.log(`   PUT  /editdashboardname/:id - Update dashboard`);
        console.log(`   DELETE /deletedahboard/:id - Delete dashboard`);
        console.log(`   GET  /loadStoredQuery - Get saved queries`);
        console.log(`   POST /api/query-data - Execute query`);
        console.log(`\n🛠️  Development commands:`);
        console.log(`   npm run db-stats - View database statistics`);
        console.log(`   npm run db-view - View database contents`);
        console.log(`   npm run reset-db - Reset database`);
    });
}).catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});