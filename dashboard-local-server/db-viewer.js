import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';

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

// Get database statistics
async function getStats() {
    try {
        console.log('📊 Database Statistics\n');
        
        const tables = await db.all(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
            ORDER BY name
        `);

        for (const table of tables) {
            const count = await db.get(`SELECT COUNT(*) as count FROM ${table.name}`);
            const columns = await db.all(`PRAGMA table_info(${table.name})`);
            
            console.log(`📋 Table: ${table.name}`);
            console.log(`   Records: ${count.count}`);
            console.log(`   Columns: ${columns.length}`);
            console.log(`   Schema: ${columns.map(c => `${c.name} (${c.type})`).join(', ')}`);
            console.log('');
        }

        // Database file info
        const dbPath = join(__dirname, 'dashboard.db');
        const fs = await import('fs');
        const stats = fs.statSync(dbPath);
        console.log(`💾 Database file size: ${(stats.size / 1024).toFixed(2)} KB`);
        console.log(`📅 Last modified: ${stats.mtime.toLocaleString()}`);
        
    } catch (error) {
        console.error('❌ Error getting statistics:', error.message);
    }
}

// List all tables
async function listTables() {
    try {
        console.log('📋 Database Tables\n');
        
        const tables = await db.all(`
            SELECT name, sql FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
            ORDER BY name
        `);

        tables.forEach((table, index) => {
            console.log(`${index + 1}. ${table.name}`);
            if (table.sql) {
                console.log(`   Schema: ${table.sql.replace(/\s+/g, ' ').substring(0, 100)}...`);
            }
            console.log('');
        });
        
    } catch (error) {
        console.error('❌ Error listing tables:', error.message);
    }
}

// View table contents
async function viewTable(tableName, limit = 10) {
    try {
        // Check if table exists
        const tableExists = await db.get(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name = ?
        `, [tableName]);

        if (!tableExists) {
            console.log(`❌ Table '${tableName}' not found`);
            return;
        }

        console.log(`📋 Table: ${tableName} (showing ${limit} records)\n`);
        
        const rows = await db.all(`SELECT * FROM ${tableName} LIMIT ?`, [limit]);
        
        if (rows.length === 0) {
            console.log('   No records found');
            return;
        }

        // Get column names
        const columns = Object.keys(rows[0]);
        
        // Print header
        console.log('   ' + columns.join(' | '));
        console.log('   ' + columns.map(col => '-'.repeat(col.length)).join('-+-'));
        
        // Print rows
        rows.forEach(row => {
            const values = columns.map(col => {
                let value = row[col];
                if (value === null) value = 'NULL';
                if (typeof value === 'string' && value.length > 20) {
                    value = value.substring(0, 17) + '...';
                }
                return String(value).padEnd(Math.max(col.length, String(value).length));
            });
            console.log('   ' + values.join(' | '));
        });
        
        console.log(`\n   Total records shown: ${rows.length}`);
        
    } catch (error) {
        console.error('❌ Error viewing table:', error.message);
    }
}

// Execute saved query
async function executeQuery(queryTitle) {
    try {
        // Get the query
        const savedQuery = await db.get(
            'SELECT title, query_text, description FROM saved_queries WHERE title = ?', 
            [queryTitle]
        );
        
        if (!savedQuery) {
            console.log(`❌ Query '${queryTitle}' not found`);
            console.log('\n📋 Available queries:');
            const queries = await db.all('SELECT title, description FROM saved_queries ORDER BY title');
            queries.forEach((q, index) => {
                console.log(`   ${index + 1}. ${q.title}`);
                if (q.description) {
                    console.log(`      ${q.description}`);
                }
            });
            return;
        }

        console.log(`🔍 Executing Query: ${savedQuery.title}`);
        if (savedQuery.description) {
            console.log(`📝 Description: ${savedQuery.description}`);
        }
        console.log(`💻 SQL: ${savedQuery.query_text}`);
        console.log('\n📊 Results:\n');
        
        const results = await db.all(savedQuery.query_text);
        
        if (results.length === 0) {
            console.log('   No results found');
            return;
        }

        // Display results in table format
        const columns = Object.keys(results[0]);
        
        // Print header
        console.log('   ' + columns.join(' | '));
        console.log('   ' + columns.map(col => '-'.repeat(Math.max(col.length, 10))).join('-+-'));
        
        // Print rows
        results.forEach(row => {
            const values = columns.map(col => {
                let value = row[col];
                if (value === null) value = 'NULL';
                if (typeof value === 'number') value = value.toLocaleString();
                return String(value).padEnd(Math.max(col.length, 10));
            });
            console.log('   ' + values.join(' | '));
        });
        
        console.log(`\n   Total results: ${results.length}`);
        
        // Update last_used timestamp
        await db.run('UPDATE saved_queries SET last_used = CURRENT_TIMESTAMP WHERE title = ?', [queryTitle]);
        
    } catch (error) {
        console.error('❌ Error executing query:', error.message);
    }
}

// Show all data
async function showAll() {
    try {
        console.log('📊 Complete Database Overview\n');
        
        await getStats();
        console.log('\n' + '='.repeat(50) + '\n');
        
        const tables = await db.all(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
            ORDER BY name
        `);

        for (const table of tables) {
            await viewTable(table.name, 5);
            console.log('\n' + '-'.repeat(50) + '\n');
        }
        
    } catch (error) {
        console.error('❌ Error showing all data:', error.message);
    }
}

// Interactive mode
async function interactiveMode() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('🔍 Interactive Database Viewer');
    console.log('Commands: tables, stats, view <table> [limit], execute "<query>", quit\n');

    const askQuestion = () => {
        rl.question('db> ', async (input) => {
            const parts = input.trim().split(' ');
            const command = parts[0].toLowerCase();

            try {
                switch (command) {
                    case 'tables':
                        await listTables();
                        break;
                    case 'stats':
                        await getStats();
                        break;
                    case 'view':
                        if (parts.length < 2) {
                            console.log('Usage: view <table_name> [limit]');
                        } else {
                            const tableName = parts[1];
                            const limit = parts[2] ? parseInt(parts[2]) : 10;
                            await viewTable(tableName, limit);
                        }
                        break;
                    case 'execute':
                        const queryTitle = input.substring(8).trim().replace(/^["']|["']$/g, '');
                        if (!queryTitle) {
                            console.log('Usage: execute "Query Title"');
                        } else {
                            await executeQuery(queryTitle);
                        }
                        break;
                    case 'quit':
                    case 'exit':
                        console.log('👋 Goodbye!');
                        rl.close();
                        await db.close();
                        return;
                    case 'help':
                        console.log('Available commands:');
                        console.log('  tables - List all tables');
                        console.log('  stats - Show database statistics');
                        console.log('  view <table> [limit] - View table contents');
                        console.log('  execute "query title" - Execute saved query');
                        console.log('  quit - Exit');
                        break;
                    default:
                        console.log('Unknown command. Type "help" for available commands.');
                }
            } catch (error) {
                console.error('❌ Error:', error.message);
            }

            console.log('');
            askQuestion();
        });
    };

    askQuestion();
}

// Main function
async function main() {
    const connected = await initDB();
    if (!connected) {
        console.log('💡 Make sure to run "npm start" first to create the database');
        process.exit(1);
    }

    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        await interactiveMode();
        return;
    }

    const command = args[0].toLowerCase();
    
    try {
        switch (command) {
            case 'stats':
                await getStats();
                break;
            case 'tables':
                await listTables();
                break;
            case 'all':
                await showAll();
                break;
            case 'view':
                if (args.length < 2) {
                    console.log('Usage: npm run db-view view <table_name> [limit]');
                } else {
                    const tableName = args[1];
                    const limit = args[2] ? parseInt(args[2]) : 10;
                    await viewTable(tableName, limit);
                }
                break;
            case 'execute':
                if (args.length < 2) {
                    console.log('Usage: npm run db-view execute "Query Title"');
                } else {
                    const queryTitle = args.slice(1).join(' ').replace(/^["']|["']$/g, '');
                    await executeQuery(queryTitle);
                }
                break;
            default:
                console.log('❌ Unknown command:', command);
                console.log('Available commands: stats, tables, all, view, execute');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await db.close();
    }
}

// Handle process termination
process.on('SIGINT', async () => {
    console.log('\n👋 Closing database connection...');
    if (db) {
        await db.close();
    }
    process.exit(0);
});

main().catch(console.error);