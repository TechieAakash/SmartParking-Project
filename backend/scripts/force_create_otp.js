const { sequelize } = require('../src/config/database');

async function forceCreateOtp() {
  try {
    console.log('🔨 Force creating otp_codes table...');
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS otp_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        contact VARCHAR(255) NOT NULL,
        code VARCHAR(6) NOT NULL,
        expiresAt DATETIME NOT NULL,
        used BOOLEAN DEFAULT false,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL,
        INDEX idx_contact (contact)
      ) ENGINE=InnoDB;
    `);

    console.log('✅ Table otp_codes created manually.');
  } catch (error) {
    console.error('❌ Creation failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

forceCreateOtp();
