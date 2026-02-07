const { sequelize } = require('../backend/src/config/database');

async function fixNaming() {
  try {
    console.log('🚀 Standardizing naming for otp_codes table...');
    
    // Check current columns
    const [columns] = await sequelize.query('DESCRIBE otp_codes');
    const fields = columns.map(c => c.Field);
    
    // Rename createdAt to created_at if it exists
    if (fields.includes('createdAt') && !fields.includes('created_at')) {
      await sequelize.query('ALTER TABLE otp_codes CHANGE createdAt created_at DATETIME NOT NULL');
      console.log('✅ Renamed createdAt to created_at');
    } else if (!fields.includes('created_at')) {
      await sequelize.query('ALTER TABLE otp_codes ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
      console.log('✅ Added created_at');
    }

    // Rename updatedAt to updated_at if it exists (model says updatedAt: false, but let's be safe)
    if (fields.includes('updatedAt') && !fields.includes('updated_at')) {
      await sequelize.query('ALTER TABLE otp_codes CHANGE updatedAt updated_at DATETIME NOT NULL');
      console.log('✅ Renamed updatedAt to updated_at');
    }

    // Drop camelCase junk if it exists
    if (fields.includes('expiresAt')) {
      await sequelize.query('ALTER TABLE otp_codes DROP COLUMN expiresAt');
      console.log('🗑️ Dropped expiresAt');
    }

    console.log('✅ Final check...');
    const [final] = await sequelize.query('DESCRIBE otp_codes');
    console.table(final);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

fixNaming();
