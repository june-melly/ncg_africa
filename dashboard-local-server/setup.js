import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Setting up Dashboard Local Server...\n');

// Create necessary directories
const directories = ['logs', 'backups'];

directories.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✅ Created directory: ${dir}/`);
    } else {
        console.log(`📁 Directory already exists: ${dir}/`);
    }
});

// Create .env.example file
const envExample = `# Dashboard Local Server Configuration
NODE_ENV=development
PORT=5000
DB_PATH=./dashboard.db

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080

# Database Configuration
DB_BACKUP_INTERVAL=3600000
MAX_BACKUP_FILES=10

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=./logs/server.log
`;

const envPath = path.join(__dirname, '.env.example');
if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, envExample);
    console.log('✅ Created .env.example file');
} else {
    console.log('📄 .env.example already exists');
}

// Create startup script for Unix systems
const startupScript = `#!/bin/bash
echo "🚀 Starting Dashboard Local Server..."
echo "📊 Database: SQLite"
echo "🔗 Server: http://localhost:5000"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the server
echo "🚀 Starting server..."
npm start
`;

const startupPath = path.join(__dirname, 'startup.sh');
if (!fs.existsSync(startupPath)) {
    fs.writeFileSync(startupPath, startupScript);
    // Make it executable on Unix systems
    try {
        fs.chmodSync(startupPath, '755');
        console.log('✅ Created startup.sh script');
    } catch (error) {
        console.log('✅ Created startup.sh script (chmod not available on this system)');
    }
} else {
    console.log('📄 startup.sh already exists');
}

// Create Windows batch file
const batchScript = `@echo off
echo 🚀 Starting Dashboard Local Server...
echo 📊 Database: SQLite
echo 🔗 Server: http://localhost:5000
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

REM Start the server
echo 🚀 Starting server...
npm start
pause
`;

const batchPath = path.join(__dirname, 'startup.bat');
if (!fs.existsSync(batchPath)) {
    fs.writeFileSync(batchPath, batchScript);
    console.log('✅ Created startup.bat script');
} else {
    console.log('📄 startup.bat already exists');
}

// Create README.md
const readme = `# Dashboard Local Server

A complete local development server for the dashboard application using SQLite database.

## Quick Start

### Option 1: Using npm scripts
\`\`\`bash
npm install
npm start
\`\`\`

### Option 2: Using startup scripts
**Unix/Mac/Linux:**
\`\`\`bash
./startup.sh
\`\`\`

**Windows:**
\`\`\`cmd
startup.bat
\`\`\`

## Available Commands

| Command | Description |
|---------|-------------|
| \`npm start\` | Start the server |
| \`npm run dev\` | Start with auto-reload (nodemon) |
| \`npm run db-stats\` | View database statistics |
| \`npm run db-tables\` | List all database tables |
| \`npm run db-view\` | Interactive database viewer |
| \`npm run reset-db\` | Reset database to initial state |
| \`npm run seed\` | Add more sample data |
| \`npm run test-api\` | Test API health check |

## API Endpoints

### Dashboard Management
- \`GET /alldashboards\` - Get all dashboards
- \`GET /render/:id\` - Get specific dashboard
- \`POST /create-dashboard\` - Create new dashboard
- \`PUT /editdashboardname/:id\` - Update dashboard
- \`DELETE /deletedahboard/:id\` - Delete dashboard

### Widget Management
- \`POST /save-widget\` - Save widget configuration
- \`GET /loadStoredQuery\` - Get available queries
- \`POST /api/query-data\` - Execute query and get data

### Sample Data
- \`GET /api/sample-data/sales\` - Get sales data
- \`GET /api/sample-data/analytics\` - Get analytics data
- \`GET /api/sample-data/transactions\` - Get transaction data

### Publishing
- \`POST /api/dashboards/publish\` - Publish dashboard
- \`POST /api/dashboards/:id/unpublish\` - Unpublish dashboard

## Database Schema

The SQLite database includes the following tables:
- \`dashboards\` - Dashboard configurations
- \`widgets\` - Widget configurations
- \`saved_queries\` - Predefined SQL queries
- \`sales_data\` - Sample sales data
- \`user_analytics\` - Sample user analytics
- \`transaction_monitoring\` - Sample transaction data

## Development

### Viewing Database Contents
\`\`\`bash
# View all tables
npm run db-tables

# View specific table
npm run db-view view dashboards

# Execute a saved query
npm run db-view execute "Sales by Product"

# View database statistics
npm run db-stats
\`\`\`

### Resetting Database
\`\`\`bash
npm run reset-db
\`\`\`

### Adding More Sample Data
\`\`\`bash
npm run seed
\`\`\`

## Configuration

Copy \`.env.example\` to \`.env\` and modify as needed:

\`\`\`env
NODE_ENV=development
PORT=5000
DB_PATH=./dashboard.db
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
\`\`\`

## Troubleshooting

### Port 5000 in use
\`\`\`bash
# Kill process using port 5000
lsof -ti:5000 | xargs kill -9

# Or change port in server.js
const PORT = 5001;
\`\`\`

### Database locked
\`\`\`bash
npm run reset-db
\`\`\`

### CORS errors
Update the CORS origins in \`server.js\`:
\`\`\`javascript
app.use(cors({
    origin: ['http://localhost:3000', 'http://your-frontend-url'],
    credentials: true
}));
\`\`\`

## Support

For issues and questions, check the console output for detailed error messages.
`;

const readmePath = path.join(__dirname, 'README.md');
if (!fs.existsSync(readmePath)) {
    fs.writeFileSync(readmePath, readme);
    console.log('✅ Created README.md');
} else {
    console.log('📄 README.md already exists');
}

console.log('\n🎉 Setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Run: npm install');
console.log('2. Run: npm start');
console.log('3. Open: http://localhost:5000/testing_backend');
console.log('\n🛠️  Development commands:');
console.log('   npm run dev      - Start with auto-reload');
console.log('   npm run db-stats - View database info');
console.log('   npm run db-view  - Browse database');
console.log('\n🚀 Ready to start developing!');