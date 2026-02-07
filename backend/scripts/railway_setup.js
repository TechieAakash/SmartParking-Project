/**
 * Railway Database Import Script - Robust Version
 * Run this to create all tables in Railway MySQL
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MYSQL_URL = process.env.MYSQL_URL;

if (!MYSQL_URL) {
  console.error('❌ MYSQL_URL not found in environment variables!');
  console.error('Please set MYSQL_URL in backend/.env');
  process.exit(1);
}

async function runImport() {
  console.log('🔗 Connecting to Railway MySQL...');
  
  try {
    // Connect with multipleStatements option
    const connection = await mysql.createConnection({
      uri: MYSQL_URL,
      multipleStatements: true
    });
    console.log('✅ Connected to Railway MySQL!');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', '..', 'railway_import.sql');
    let sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Executing SQL import (this may take a moment)...');
    
    // Execute the entire SQL file at once
    await connection.query(sql);
    
    console.log('✅ SQL executed successfully!');
    
    // Show final tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log('');
    console.log('📊 Tables in Railway database:');
    tables.forEach(t => console.log(`   - ${Object.values(t)[0]}`));
    console.log(`\nTotal: ${tables.length} tables`);
    
    // Show sample data
    const [users] = await connection.query('SELECT username, email, role FROM users');
    console.log('\n👤 Users:');
    users.forEach(u => console.log(`   - ${u.username} (${u.role})`));
    
    const [zones] = await connection.query('SELECT name FROM parking_zones LIMIT 5');
    console.log('\n🅿️ Sample Zones:');
    zones.forEach(z => console.log(`   - ${z.name}`));

    await connection.end();
    console.log('\n🎉 Railway database setup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.sql) {
      console.error('SQL:', error.sql.substring(0, 200));
    }
    process.exit(1);
  }
}

runImport();
