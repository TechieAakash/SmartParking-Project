const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function checkOrphans() {
  let connection;
  try {
    const config = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'admin123',
      database: 'smartparking'
    };

    connection = await mysql.createConnection(config);
    const [txns] = await connection.query('SELECT id, wallet_id, user_id FROM wallet_transactions');
    console.log('Transactions:', txns);
    
    const [wallets] = await connection.query('SELECT id, user_id FROM wallets');
    console.log('Wallets:', wallets);

  } catch (error) {
    console.error('Fatal error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

checkOrphans();
