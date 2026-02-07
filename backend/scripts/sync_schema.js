const mysql = require('mysql2/promise');
const config = require('../src/config/env');

async function syncSchema() {
  console.log('🔧 Starting detailed schema sync...');
  
  const connection = await mysql.createConnection({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name
  });

  try {
    // Add missing columns one by one
    const queries = [
       "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS zone_id INT unsigned",
       "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS slot_id INT unsigned",
       "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_start DATETIME",
       "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_end DATETIME",
       "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS duration INT",
       "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_price DECIMAL(10, 2)",
       "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status ENUM('pending', 'paid', 'refunded', 'failed') DEFAULT 'pending'",
       "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_code VARCHAR(50)",
       "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS qr_code VARCHAR(100)",
       "ALTER TABLE bookings MODIFY COLUMN status ENUM('pending', 'active', 'completed', 'cancelled', 'expired') DEFAULT 'pending'",
       "ALTER TABLE bookings MODIFY COLUMN booking_type ENUM('hourly', 'daily', 'monthly', 'yearly') DEFAULT 'hourly'"
    ];

    for (const q of queries) {
        try {
            await connection.query(q);
            console.log(`✅ Executed: ${q}`);
        } catch (e) {
            console.log(`⚠️ Skiping/Error: ${q} - ${e.message}`);
        }
    }

    // Fix Foreign Key if possible (ignore if fails)
    try {
        await connection.query("ALTER TABLE bookings ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE");
        console.log("✅ FK user_id added");
    } catch(e) {}

    console.log('✅ Schema sync completed!');
  } catch (error) {
    console.error('❌ Error syncing schema:', error);
  } finally {
    await connection.end();
  }
}

syncSchema();
