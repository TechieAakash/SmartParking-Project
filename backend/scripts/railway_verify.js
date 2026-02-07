/**
 * Verify Railway Database Setup
 */

const mysql = require('mysql2/promise');

const MYSQL_URL = 'mysql://root:QknKljREygofzvfcmmEZCfeUcPUgJMiC@mainline.proxy.rlwy.net:56393/railway';

async function verify() {
  console.log('🔗 Connecting to Railway MySQL...');
  
  try {
    const connection = await mysql.createConnection(MYSQL_URL);
    console.log('✅ Connected!');
    
    // Show tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log('');
    console.log('📊 Tables in Railway database:');
    tables.forEach(t => console.log(`   - ${Object.values(t)[0]}`));
    console.log('');
    console.log(`Total: ${tables.length} tables`);
    
    // Check users
    const [users] = await connection.query('SELECT id, username, email, role FROM users LIMIT 5');
    console.log('');
    console.log('👤 Users:');
    users.forEach(u => console.log(`   - ${u.username} (${u.email}) - ${u.role}`));
    
    // Check zones
    const [zones] = await connection.query('SELECT id, name FROM parking_zones LIMIT 5');
    console.log('');
    console.log('🅿️ Parking Zones:');
    zones.forEach(z => console.log(`   - ${z.name}`));
    
    await connection.end();
    console.log('');
    console.log('✅ Railway database is ready!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verify();
