/**
 * Add missing valid_officer_badges table to Railway
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MYSQL_URL = process.env.MYSQL_URL;

async function addTable() {
  console.log('🔗 Connecting to Railway MySQL...');
  
  const connection = await mysql.createConnection(MYSQL_URL);
  console.log('✅ Connected!');
  
  // Create the missing table
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS valid_officer_badges (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      badge_id VARCHAR(50) UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  await connection.query(createTableSQL);
  console.log('✅ Created valid_officer_badges table');
  
  // Seed with sample badges
  const badges = [];
  for (let i = 1001; i <= 1050; i++) {
    badges.push(`('MCD-OFF-${i}')`);
  }
  
  const insertSQL = `INSERT IGNORE INTO valid_officer_badges (badge_id) VALUES ${badges.join(', ')};`;
  await connection.query(insertSQL);
  console.log('✅ Seeded 50 officer badges');
  
  await connection.end();
  console.log('🎉 Done!');
}

addTable().catch(console.error);
