const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function getUser() {
  let connection;
  try {
    const config = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'admin123',
      database: process.env.DB_NAME || 'smartpark'
    };

    connection = await mysql.createConnection(config);
    const [rows] = await connection.query('SELECT username, role, full_name FROM users WHERE id = 4');
    console.log('User 4 Details:', rows[0]);

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    if (connection) await connection.end();
  }
}

getUser();
