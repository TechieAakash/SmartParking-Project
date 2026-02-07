const { sequelize, OtpCode } = require('../src/models');

async function syncOtpTable() {
  try {
    console.log('🔄 Syncing OtpCode model...');
    await OtpCode.sync({ alter: true });
    console.log('✅ OtpCode table synced successfully');
  } catch (error) {
    console.error('❌ Error syncing OtpCode table:', error);
  } finally {
    await sequelize.close();
  }
}

syncOtpTable();
