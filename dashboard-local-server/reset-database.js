import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = path.join(__dirname, 'dashboard.db');

console.log('🔄 Resetting database...');

try {
    if (fs.existsSync(dbPath)) {
        // Create backup before deleting
        const backupPath = path.join(__dirname, 'backups', `dashboard-backup-${Date.now()}.db`);
        fs.copyFileSync(dbPath, backupPath);
        console.log(`💾 Backup created: ${path.basename(backupPath)}`);
        
        // Delete the database file
        fs.unlinkSync(dbPath);
        console.log('🗑️  Database file deleted');
    } else {
        console.log('📄 No database file found');
    }
    
    console.log('✅ Database reset complete');
    console.log('💡 Run "npm start" to recreate the database with fresh data');
    
} catch (error) {
    console.error('❌ Error resetting database:', error.message);
    process.exit(1);
}