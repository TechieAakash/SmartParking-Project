const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function checkSchema() {
  let connection;
  try {
    const config = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'admin123',
      database: 'smartparking'
    };

    connection = await mysql.createConnection(config);
    const [cols] = await connection.query('DESCRIBE wallet_transactions');
    console.log('WalletTransactions Columns:', cols);

  } catch (error) {
    console.error('Fatal error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

checkSchema();
