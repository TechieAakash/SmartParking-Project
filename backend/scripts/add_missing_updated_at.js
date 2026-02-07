const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function fixSchema() {
  let connection;
  try {
    const config = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'admin123',
      database: 'smartparking'
    };

    connection = await mysql.createConnection(config);
    console.log('Adding updated_at to wallet_transactions...');
    await connection.query('ALTER TABLE wallet_transactions ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at');
    console.log('Adding updated_at to wallets...');
    try {
        await connection.query('ALTER TABLE wallets ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at');
    } catch (e) {
        console.log('Wallets updated_at might already exist or error:', e.message);
    }
    console.log('Schema fixed.');

  } catch (error) {
    console.error('Fatal error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

fixSchema();
