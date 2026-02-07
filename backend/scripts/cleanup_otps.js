const { OtpCode, sequelize } = require('../src/models');
const { Op } = require('sequelize');

async function cleanupExpiredOtps() {
  try {
    console.log('🧹 Starting cleanup of expired OTPs...');
    
    // Delete OTPs that are expired OR used
    const result = await OtpCode.destroy({
      where: {
        [Op.or]: [
          { expiresAt: { [Op.lt]: new Date() } },
          { used: true }
        ]
      }
    });

    console.log(`✅ Cleanup complete. Deleted ${result} expired/used OTPs.`);
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Allow running directly
if (require.main === module) {
  cleanupExpiredOtps();
}

module.exports = cleanupExpiredOtps;
