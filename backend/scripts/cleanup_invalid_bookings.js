const { sequelize, Booking } = require('../src/models');
const { Op } = require('sequelize');

async function cleanup() {
  try {
    // Delete bookings with abnormally high price (likely subscriptions saved as hourly)
    const count = await Booking.destroy({
      where: {
        totalPrice: {
          [Op.gt]: 2000 // Threshold: Hourly parking shouldn't exceed 2000 normally
        }
      }
    });

    console.log(`Deleted ${count} invalid bookings.`);
  } catch (error) {
    console.error('Cleanup failed:', error);
  } finally {
    await sequelize.close();
  }
}

cleanup();
