const { sequelize, Booking, Wallet, WalletTransaction } = require('../src/models');
const { Op } = require('sequelize');

async function refundAndCleanup() {
  const transaction = await sequelize.transaction();
  try {
    // Find invalid bookings
    const invalidBookings = await Booking.findAll({
      where: {
        totalPrice: { [Op.gt]: 2000 }
      },
      transaction
    });

    if (invalidBookings.length === 0) {
        console.log('No invalid bookings found.');
        await transaction.rollback();
        return;
    }

    console.log(`Found ${invalidBookings.length} invalid bookings. Processing refunds...`);

    for (const booking of invalidBookings) {
        const amount = parseFloat(booking.totalPrice);
        const userId = booking.userId;

        console.log(`Processing Booking #${booking.id} (User: ${userId}, Amount: ${amount})`);

        // Refund Wallet
        const wallet = await Wallet.findOne({ where: { userId }, transaction });
        if (wallet) {
            await wallet.update({
                balance: parseFloat(wallet.balance) + amount
            }, { transaction });
            
            // Log Transaction
            await WalletTransaction.create({
                walletId: wallet.id,
                amount: amount,
                type: 'refund',
                description: `System Refund for Invalid Booking #${booking.id}`,
                status: 'completed'
            }, { transaction });
            
            console.log(`> Refunded ₹${amount} to User ${userId}`);
        } else {
            console.log(`> Wallet not found for User ${userId}, skipping refund.`);
        }

        // Delete Booking
        await booking.destroy({ transaction });
        console.log(`> Deleted Booking #${booking.id}`);
    }

    await transaction.commit();
    console.log('Refund and Cleanup completed successfully.');

  } catch (error) {
    await transaction.rollback();
    console.error('Error during cleanup:', error);
  } finally {
    await sequelize.close();
  }
}

refundAndCleanup();
