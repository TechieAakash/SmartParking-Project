const mysql = require('mysql2/promise');

async function checkTables() {
  const connection = await mysql.createConnection({
    host: 'mainline.proxy.rlwy.net',
    user: 'root',
    password: 'QknKljREygofzvfcmmEZCfeUcPUgJMiC',
    port: 56393,
    database: 'railway',
    ssl: { rejectUnauthorized: false }
  });

  try {
    const [allTables] = await connection.query("SHOW TABLES");
    console.log('Tables check:');
    
    for (const row of allTables) {
      const tableName = Object.values(row)[0];
      if (tableName.includes('wallet') || tableName.includes('payment') || tableName.includes('booking')) {
         const [cnt] = await connection.query(`SELECT COUNT(*) as c FROM ${tableName}`);
         console.log(`${tableName}: ${cnt[0].c} rows`);
      }
    }

  } catch (error) {
    console.error('Error checking tables:', error.message);
  } finally {
    await connection.end();
  }
}

checkTables();
