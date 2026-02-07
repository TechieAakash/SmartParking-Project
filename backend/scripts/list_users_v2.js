const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function listUsers() {
  let connection;
  try {
    const config = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'admin123',
      database: 'smartparking' 
    };

    connection = await mysql.createConnection(config);
    const [rows] = await connection.query('SELECT id, username, role FROM users');
    console.log('All Users in smartparking:', rows);

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    if (connection) await connection.end();
  }
}

listUsers();
