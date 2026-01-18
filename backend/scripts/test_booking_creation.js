const { sequelize } = require('../src/config/database');
const Booking = require('../src/models/Booking');
const User = require('../src/models/User');
const Vehicle = require('../src/models/Vehicle');
const ParkingSlot = require('../src/models/ParkingSlot');

async function testBookingCreation() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    const transaction = await sequelize.transaction();

    try {
        console.log('📝 Attempting to create booking record...');
        const booking = await Booking.create({
            userId: 4, // mamta2024
            slotId: 10, // Assuming slot 10 exists from previous logs
            vehicleId: 1,
            bookingStart: new Date(),
            bookingEnd: new Date(Date.now() + 3600000),
            bookingType: 'hourly',
            status: 'active'
        }, { transaction });

        console.log('✅ Booking created successfully:', booking.id);
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        console.error('❌ Failed to create booking:', error);
        console.error('❌ Error Name:', error.name);
        if (error.original) {
            console.error('❌ SQL Message:', error.original.sqlMessage);
            console.error('❌ SQL:', error.original.sql);
        }
    }

  } catch (error) {
    console.error('❌ Database connection error:', error);
  } finally {
    await sequelize.close();
  }
}

testBookingCreation();
