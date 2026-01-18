const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function fixSchema() {
  let connection;
  try {
    const config = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'admin123',
      database: process.env.DB_NAME || 'smartpark',
      multipleStatements: true
    };

    console.log('Connecting to database...');
    connection = await mysql.createConnection(config);
    console.log('Connected.');

    // Add timestamps to wallet_transactions
    console.log('Checking wallet_transactions table...');
    try {
        await connection.query(`
            ALTER TABLE wallet_transactions 
            ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
        `);
        console.log('Added timestamps to wallet_transactions.');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('Columns already exist in wallet_transactions.');
        } else {
            console.error('Error altering wallet_transactions:', err.message);
        }
    }

    // Add timestamps to wallets (optional but good)
    console.log('Checking wallets table...');
    try {
        await connection.query(`
            ALTER TABLE wallets 
            ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
        `);
        console.log('Added timestamps to wallets.');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('Columns already exist in wallets.');
        } else {
            console.error('Error altering wallets:', err.message);
        }
    }

    console.log('Schema update complete.');

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    if (connection) await connection.end();
  }
}

fixSchema();
