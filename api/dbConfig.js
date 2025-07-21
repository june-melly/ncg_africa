import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables with absolute path
dotenv.config({ path: path.join(__dirname, '.env') });

const dbConfig = {
  server: process.env.SERVER,
  database: process.env.DB,
  user: process.env.USER,
  password: process.env.PASSWORD,
  port: 1433,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

export default dbConfig;
