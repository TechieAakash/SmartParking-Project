const { sequelize } = require('../src/config/database');

async function checkDbStatus() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection OK');

    const [results] = await sequelize.query('SELECT 1');
    console.log('✅ Simple query execution OK');

    // Check table counts
    const [userCount] = await sequelize.query('SELECT COUNT(*) as count FROM users');
    const [otpCount] = await sequelize.query('SELECT COUNT(*) as count FROM otp_codes');
    
    console.log('📊 Table Status:');
    console.log(`- Users: ${userCount[0].count}`);
    console.log(`- OTP Codes: ${otpCount[0].count}`);

  } catch (error) {
    console.error('❌ DB Check Failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkDbStatus();
