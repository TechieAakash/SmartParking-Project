const mysql = require('mysql2/promise');
const config = require('../src/config/env');

async function fixDatabase() {
  console.log('🔧 Starting database fix...');
  
  const connection = await mysql.createConnection({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name
  });

  try {
    console.log('📊 Checking bookings table columns...');
    const [columns] = await connection.query('SHOW COLUMNS FROM bookings');
    const columnNames = columns.map(c => c.Field);
    console.log('Existing columns:', columnNames);

    if (!columnNames.includes('slot_id')) {
      console.log('⚠️ slot_id missing. Adding it...');
      await connection.query('ALTER TABLE bookings ADD COLUMN slot_id INT UNSIGNED AFTER user_id');
      console.log('✅ slot_id added.');
    } else {
      console.log('✅ slot_id already exists.');
    }

    if (!columnNames.includes('booking_start')) {
        console.log('⚠️ booking_start missing. Adding it...');
        await connection.query('ALTER TABLE bookings ADD COLUMN booking_start DATETIME NOT NULL');
        console.log('✅ booking_start added.');
    }

    if (!columnNames.includes('booking_end')) {
        console.log('⚠️ booking_end missing. Adding it...');
        await connection.query('ALTER TABLE bookings ADD COLUMN booking_end DATETIME NOT NULL');
        console.log('✅ booking_end added.');
    }
    
    // Ensure booking_type and status exist
    if (!columnNames.includes('booking_type')) {
        console.log('Adding booking_type...');
        await connection.query("ALTER TABLE bookings ADD COLUMN booking_type ENUM('hourly', 'daily', 'monthly', 'yearly') DEFAULT 'hourly'");
    }

    console.log('✅ Database fix completed!');
  } catch (error) {
    console.error('❌ Error fixing database:', error);
  } finally {
    await connection.end();
  }
}

fixDatabase();
