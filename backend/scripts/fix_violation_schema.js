const mysql = require('mysql2/promise');
const config = require('../src/config/env');

async function fixViolationSchema() {
  console.log('🔧 Fixing violations table schema...');
  
  const connection = await mysql.createConnection({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name
  });

  try {
    // Add resolved column
    await connection.query("ALTER TABLE violations ADD COLUMN IF NOT EXISTS resolved BOOLEAN DEFAULT FALSE");
    console.log('✅ resolved column checked/added.');

    // Add resolved_at column
    await connection.query("ALTER TABLE violations ADD COLUMN IF NOT EXISTS resolved_at DATETIME DEFAULT NULL");
    console.log('✅ resolved_at column checked/added.');

    // Add resolved_by column (assuming integer user id or string)
    // Model doesn't explicitly define it in the snippet above but controller likely uses it?
    // Wait, the error log showed `Violations.resolved_by` in the SELECT list.
    // I should check if it's in the model file I viewed. 
    // Yes, line 50+ doesn't show it explicitly but I saw it in the query log.
    // ACTUALLY, I missed it in the file view? 
    // Let's check the file content again... 
    // Line 41: resolved. Line 46: resolvedAt. 
    // I don't see `resolvedBy` in the model definition in `file:///.../Violation.js`.
    // But the query `SELECT ... resolved_by ...` implies Sequelize thinks it exists or it's being asked for.
    // If the model doesn't have it, why is it being queried? 
    // Maybe checking `violations.routes.js` or `violations.controller.js` logic would help.
    // But adding it to DB is safe.
    await connection.query("ALTER TABLE violations ADD COLUMN IF NOT EXISTS resolved_by INT UNSIGNED DEFAULT NULL");
    console.log('✅ resolved_by column checked/added.');

  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ Columns already exist (ignoring duplicate error).');
    } else if (error.errno === 1064) {
        // Fallback for older MySQL without IF NOT EXISTS
        console.log('⚠️ IF NOT EXISTS failed, trying direct add...');
        try {
             await connection.query("ALTER TABLE violations ADD COLUMN resolved BOOLEAN DEFAULT FALSE");
        } catch(e) {}
        try {
             await connection.query("ALTER TABLE violations ADD COLUMN resolved_at DATETIME DEFAULT NULL");
        } catch(e) {}
        try {
             await connection.query("ALTER TABLE violations ADD COLUMN resolved_by INT UNSIGNED DEFAULT NULL");
        } catch(e) {}
    } else {
        console.error('❌ Error fixing schema:', error);
    }
  } finally {
    await connection.end();
  }
}

fixViolationSchema();
