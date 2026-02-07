/**
 * Verify Railway Database Setup
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MYSQL_URL = process.env.MYSQL_URL;

if (!MYSQL_URL) {
  console.error('❌ MYSQL_URL not found in environment variables!');
  process.exit(1);
}

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
