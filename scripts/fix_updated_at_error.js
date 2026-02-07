const { sequelize } = require('../backend/src/config/database');

async function fixUpdatedAt() {
  try {
    console.log('🚀 Removing updated_at from otp_codes (since model sets updatedAt: false)...');
    
    // Drop the column using standard syntax + try/catch
    try {
      await sequelize.query('ALTER TABLE otp_codes DROP COLUMN updated_at');
      console.log('✅ Dropped updated_at');
    } catch (e) {
      console.log('Note: updated_at already gone or failed to drop:', e.message);
    }
    
    // Ensure created_at is safe
    try {
      await sequelize.query('ALTER TABLE otp_codes MODIFY created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
      console.log('✅ created_at updated with default');
    } catch (e) {
       console.log('Note: could not modify created_at:', e.message);
    }
    
    console.log('✅ Column dropped and created_at defaulted!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Fix failed:', err.message);
    process.exit(1);
  }
}

fixUpdatedAt();
