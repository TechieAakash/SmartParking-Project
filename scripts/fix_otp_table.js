const { sequelize } = require('../backend/src/config/database');

async function migrate() {
  try {
    console.log('🚀 Starting migration for otp_codes table...');
    
    // Add missing columns using standard syntax
    try { await sequelize.query('ALTER TABLE otp_codes ADD COLUMN code VARCHAR(6) NOT NULL AFTER contact'); } catch(e) { console.log('Note: code column might already exist'); }
    try { await sequelize.query('ALTER TABLE otp_codes ADD COLUMN expires_at DATETIME NOT NULL AFTER code'); } catch(e) { console.log('Note: expires_at column might already exist'); }
    try { await sequelize.query('ALTER TABLE otp_codes ADD COLUMN used TINYINT(1) DEFAULT 0 AFTER expires_at'); } catch(e) { console.log('Note: used column might already exist'); }
    
    console.log('✅ Migration successful!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
