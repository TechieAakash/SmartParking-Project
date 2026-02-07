const { sequelize } = require('../src/config/database');

async function checkOtpTable() {
  try {
    const [results] = await sequelize.query("SHOW TABLES LIKE 'otp_codes'");
    if (results.length > 0) {
      console.log('✅ otp_codes table EXISTS');
    } else {
      console.log('❌ otp_codes table DOES NOT EXIST');
    }
  } catch (error) {
    console.error('Check failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkOtpTable();
