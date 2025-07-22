import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db;

// Initialize database connection
async function initDB() {
    try {
        db = await open({
            filename: join(__dirname, 'dashboard.db'),
            driver: sqlite3.Database
        });
        return true;
    } catch (error) {
        console.error('❌ Error connecting to database:', error.message);
        return false;
    }
}

// Add more sample data
async function addMoreSampleData() {
    try {
        console.log('🌱 Adding more sample data...\n');

        // Add more sales data
        const additionalSalesData = [
            ['Gaming Chair', 299.99, '2024-01-25', 'North America', 'John Smith'],
            ['USB-C Hub', 49.99, '2024-01-26', 'Europe', 'Sarah Johnson'],
            ['External SSD', 129.99, '2024-01-27', 'Asia', 'Mike Chen'],
            ['Wireless Earbuds', 159.99, '2024-01-28', 'North America', 'Emily Davis'],
            ['Smart Watch', 249.99, '2024-01-29', 'Europe', 'David Wilson'],
            ['Portable Battery', 39.99, '2024-01-30', 'Asia', 'Lisa Wang'],
            ['Desk Lamp LED', 69.99, '2024-01-31', 'North America', 'John Smith'],
            ['Phone Case', 19.99, '2024-02-01', 'Europe', 'Sarah Johnson'],
            ['Cable Organizer', 14.99, '2024-02-02', 'Asia', 'Mike Chen'],
            ['Laptop Stand', 79.99, '2024-02-03', 'North America', 'Emily Davis']
        ];

        for (const [product, amount, date, region, salesperson] of additionalSalesData) {
            await db.run(
                'INSERT INTO sales_data (product_name, sales_amount, sale_date, region, salesperson) VALUES (?, ?, ?, ?, ?)',
                [product, amount, date, region, salesperson]
            );
        }
        console.log('✅ Added 10 more sales records');

        // Add more user analytics data
        const additionalAnalyticsData = [
            ['user_006', 18, 1200, 0.35, '2024-01-18', 'Mobile'],
            ['user_007', 52, 4800, 0.08, '2024-01-18', 'Desktop'],
            ['user_008', 12, 720, 0.50, '2024-01-19', 'Tablet'],
            ['user_009', 28, 2100, 0.20, '2024-01-19', 'Desktop'],
            ['user_010', 6, 300, 0.75, '2024-01-20', 'Mobile']
        ];

        for (const [userId, views, duration, bounce, date, device] of additionalAnalyticsData) {
            await db.run(
                'INSERT INTO user_analytics (user_id, page_views, session_duration, bounce_rate, date_recorded, device_type) VALUES (?, ?, ?, ?, ?, ?)',
                [userId, views, duration, bounce, date, device]
            );
        }
        console.log('✅ Added 5 more analytics records');

        // Add more saved queries
        const additionalQueries = [
            ['Daily Sales Trend', 'SELECT sale_date, SUM(sales_amount) as daily_total FROM sales_data GROUP BY sale_date ORDER BY sale_date DESC LIMIT 30', 'Last 30 days sales trend'],
            ['Product Performance', 'SELECT product_name, COUNT(*) as units_sold, SUM(sales_amount) as total_revenue FROM sales_data GROUP BY product_name ORDER BY total_revenue DESC', 'Product sales performance ranking'],
            ['Regional Revenue', 'SELECT region, COUNT(*) as transactions, AVG(sales_amount) as avg_sale, SUM(sales_amount) as total_revenue FROM sales_data GROUP BY region ORDER BY total_revenue DESC', 'Revenue breakdown by region'],
            ['Device Usage Stats', 'SELECT device_type, COUNT(*) as users, AVG(page_views) as avg_views, AVG(session_duration) as avg_duration FROM user_analytics GROUP BY device_type', 'User behavior by device type'],
            ['Error Rate Analysis', 'SELECT transaction_type, (failure_count * 100.0 / total_transactions) as error_rate, last_error FROM transaction_monitoring ORDER BY error_rate DESC', 'Transaction error rates analysis']
        ];

        for (const [title, queryText, description] of additionalQueries) {
            try {
                await db.run(
                    'INSERT INTO saved_queries (title, query_text, description) VALUES (?, ?, ?)',
                    [title, queryText, description]
                );
            } catch (error) {
                if (error.message.includes('UNIQUE constraint failed')) {
                    console.log(`⚠️  Query "${title}" already exists, skipping`);
                } else {
                    throw error;
                }
            }
        }
        console.log('✅ Added 5 more saved queries');

        // Add more dashboards
        const additionalDashboards = [
            ['Product Analytics', 'Detailed product performance and inventory tracking'],
            ['Customer Insights', 'Customer behavior and engagement metrics'],
            ['Operations Dashboard', 'Operational KPIs and system health monitoring'],
            ['Executive Summary', 'High-level business metrics for leadership team']
        ];

        for (const [name, description] of additionalDashboards) {
            try {
                await db.run(
                    'INSERT INTO dashboards (name, description, widgets, is_published) VALUES (?, ?, ?, ?)',
                    [name, description, '[]', Math.random() > 0.5 ? 'Published' : 'Draft']
                );
            } catch (error) {
                if (error.message.includes('UNIQUE constraint failed')) {
                    console.log(`⚠️  Dashboard "${name}" already exists, skipping`);
                } else {
                    throw error;
                }
            }
        }
        console.log('✅ Added 4 more dashboards');

        console.log('\n🎉 Sample data seeding completed successfully!');
        
        // Show updated statistics
        const dashboardCount = await db.get('SELECT COUNT(*) as count FROM dashboards');
        const salesCount = await db.get('SELECT COUNT(*) as count FROM sales_data');
        const analyticsCount = await db.get('SELECT COUNT(*) as count FROM user_analytics');
        const queriesCount = await db.get('SELECT COUNT(*) as count FROM saved_queries');
        
        console.log('\n📊 Updated Database Statistics:');
        console.log(`   Dashboards: ${dashboardCount.count}`);
        console.log(`   Sales Records: ${salesCount.count}`);
        console.log(`   Analytics Records: ${analyticsCount.count}`);
        console.log(`   Saved Queries: ${queriesCount.count}`);
        
    } catch (error) {
        console.error('❌ Error adding sample data:', error.message);
        throw error;
    }
}

// Main function
async function main() {
    const connected = await initDB();
    if (!connected) {
        console.log('💡 Make sure to run "npm start" first to create the database');
        process.exit(1);
    }

    try {
        await addMoreSampleData();
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    } finally {
        await db.close();
    }
}

main().catch(console.error);