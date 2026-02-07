const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function listTables() {
  let connection;
  try {
    const config = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'admin123',
      database: process.env.DB_NAME || 'smartpark'
    };

    connection = await mysql.createConnection(config);
    const [rows] = await connection.query('SHOW TABLES');
    console.log('Tables in database:', rows);

    // Also check columns of a likely match if found
    const likelyMatches = rows.map(r => Object.values(r)[0]).filter(t => t.toLowerCase().includes('wallet'));
    if (likelyMatches.length > 0) {
        console.log('Found likely wallet tables:', likelyMatches);
        for (const table of likelyMatches) {
            const [cols] = await connection.query(`DESCRIBE ${table}`);
            console.log(`Columns in ${table}:`, cols.map(c => c.Field));
        }
    }

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    if (connection) await connection.end();
  }
}

listTables();
