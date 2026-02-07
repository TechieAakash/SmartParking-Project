const mysql = require('mysql2/promise');

async function optimizeDatabase() {
  const connection = await mysql.createConnection({
    host: 'mainline.proxy.rlwy.net',
    user: 'root',
    password: 'QknKljREygofzvfcmmEZCfeUcPUgJMiC',
    port: 56393,
    database: 'railway',
    ssl: { rejectUnauthorized: false }
  });

  console.log('🚀 Starting Database Optimization...');

  const queries = [
    // Bookings optimization
    "ALTER TABLE bookings ADD INDEX idx_bookings_user (user_id);",
    "ALTER TABLE bookings ADD INDEX idx_bookings_zone (zone_id);",
    "ALTER TABLE bookings ADD INDEX idx_bookings_status (status);",
    
    // Vehicles optimization
    "ALTER TABLE vehicles ADD INDEX idx_vehicles_user (user_id);",
    
    // Wallet Transactions optimization
    "ALTER TABLE wallet_transactions ADD INDEX idx_wallet_tx_user (user_id);",
    "ALTER TABLE wallet_transactions ADD INDEX idx_wallet_tx_wallet (wallet_id);",
    
    // Passes/Subscriptions optimization
    "ALTER TABLE passes ADD INDEX idx_passes_user (user_id);",
    "ALTER TABLE passes ADD INDEX idx_passes_zone (zone_id);",
    
    // Parking Slots optimization
    "ALTER TABLE parking_slots ADD INDEX idx_slots_zone (zone_id);",
    "ALTER TABLE parking_slots ADD INDEX idx_slots_status (status);"
  ];

  for (const query of queries) {
    try {
      console.log(`Executing: ${query}`);
      await connection.query(query);
      console.log('✅ Success');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️ Index already exists, skipping.');
      } else {
        console.error(`❌ Error: ${err.message}`);
      }
    }
  }

  await connection.end();
  console.log('Done.');
}

optimizeDatabase();
