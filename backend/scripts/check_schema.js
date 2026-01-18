const mysql = require('mysql2/promise');
const config = require('../src/config/env');

async function checkSchema() {
  const connection = await mysql.createConnection({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name
  });

  const [rows] = await connection.query('DESCRIBE bookings');
  console.log('Columns in bookings table:');
  rows.forEach(r => {
    console.log(`${r.Field}: Type=${r.Type}, Null=${r.Null}, Default=${r.Default}`);
  });
  await connection.end();
}

checkSchema();
