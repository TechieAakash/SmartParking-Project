const mysql = require('mysql2/promise');
const config = require('../src/config/env');

async function addEntryTime() {
  console.log('🔧 Adding entry_time column...');
  
  const connection = await mysql.createConnection({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name
  });

  try {
    // Check if column exists first
    const [cols] = await connection.query("SHOW COLUMNS FROM bookings LIKE 'entry_time'");
    if (cols.length === 0) {
        await connection.query("ALTER TABLE bookings ADD COLUMN entry_time DATETIME DEFAULT NULL");
        console.log('✅ entry_time added successfully.');
    } else {
        console.log('✅ entry_time already exists.');
    }
  } catch (error) {
    console.error('❌ Error adding entry_time:', error);
  } finally {
    await connection.end();
  }
}

addEntryTime();
