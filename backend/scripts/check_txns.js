const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function checkTxns() {
  let connection;
  try {
    const config = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'admin123',
      database: 'smartparking'
    };

    connection = await mysql.createConnection(config);
    const [rows] = await connection.query('SELECT * FROM wallet_transactions WHERE user_id = 4');
    console.log('Transactions for user 4:', rows);

  } catch (error) {
    console.error('Fatal error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

checkTxns();
