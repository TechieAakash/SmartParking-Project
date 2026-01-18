const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function inspectUsers() {
  let connection;
  try {
    const config = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'admin123',
      database: process.env.DB_NAME || 'smartpark'
    };

    connection = await mysql.createConnection(config);
    const [cols] = await connection.query('DESCRIBE users');
    const idCol = cols.find(c => c.Field === 'id');
    console.log('User ID Definition:', idCol);

    const [wCols] = await connection.query('DESCRIBE wallets').catch(e => [[], []]);
    if (wCols.length) console.log('Wallets table exists:', wCols);
    else console.log('Wallets table does not exist.');

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    if (connection) await connection.end();
  }
}

inspectUsers();
