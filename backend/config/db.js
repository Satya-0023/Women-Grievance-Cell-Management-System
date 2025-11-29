// File: backend/config/db.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Correctly locate the .env file from the root of the backend directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Create the connection pool using the promise-based library
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    timezone: "+05:30",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

console.log('MySQL Promise Pool configured.');

// Export the promise-based pool directly.
// All modern models and services will use this.
export default pool;