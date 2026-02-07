const mysql = require('mysql2/promise');
const config = require('../src/config/env');

async function addTotalPriceToBooking() {
  console.log('🔧 Adding total_price column to bookings table...');
  
  const connection = await mysql.createConnection({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name
  });

  try {
    // Add total_price column
    try {
        await connection.query("ALTER TABLE bookings ADD COLUMN total_price DECIMAL(10, 2) DEFAULT 0.00");
        console.log('✅ total_price column added.');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('✅ total_price column already exists.');
        } else {
            throw e;
        }
    }

  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ Column already exists (ignoring duplicate error).');
    } else {
        console.error('❌ Error fixing schema:', error);
    }
  } finally {
    await connection.end();
  }
}

addTotalPriceToBooking();
