import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env

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
