const { sequelize } = require('../src/config/database');
const Booking = require('../src/models/Booking');
const fs = require('fs');

async function testBooking() {
  try {
    await sequelize.authenticate();
    const transaction = await sequelize.transaction();
    try {
        const booking = await Booking.create({
            userId: 4,
            slotId: 10,
            vehicleId: 1,
            bookingStart: new Date(),
            bookingEnd: new Date(Date.now() + 3600000),
            bookingType: 'hourly',
            status: 'active'
        }, { transaction });
        console.log('SUCCESS: BookingCreated');
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        console.log('ERROR_OCCURRED');
        const errInfo = {
            message: error.message,
            sql: error.original ? error.original.sql : 'N/A',
            sqlMessage: error.original ? error.original.sqlMessage : 'N/A'
        };
        fs.writeFileSync('error_details.json', JSON.stringify(errInfo, null, 2));
    }
  } catch (e) {
      console.log('DB_CXN_ERROR');
  } finally {
      await sequelize.close();
  }
}
testBooking();
