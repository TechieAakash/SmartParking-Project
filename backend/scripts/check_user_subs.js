const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function checkSubs() {
  let connection;
  try {
    const config = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'admin123',
      database: 'smartparking'
    };

    connection = await mysql.createConnection(config);
    const [rows] = await connection.query('SELECT id, status, startDate, endDate, price FROM passes WHERE user_id = 4');
    console.log('Subscriptions for user 4:', rows);

  } catch (error) {
    console.error('Fatal error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

checkSubs();
