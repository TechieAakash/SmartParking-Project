const { sequelize } = require('../backend/src/config/database');

async function addGoogleId() {
  try {
    console.log('🚀 Adding google_id to users table...');
    
    // Add missing column
    try {
      await sequelize.query('ALTER TABLE users ADD COLUMN google_id VARCHAR(100) NULL UNIQUE AFTER status');
      console.log('✅ Added google_id column');
    } catch (e) {
      console.log('Note: google_id might already exist:', e.message);
    }
    
    console.log('✅ Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

addGoogleId();
