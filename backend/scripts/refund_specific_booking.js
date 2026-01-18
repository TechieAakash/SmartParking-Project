const { sequelize, Booking, Wallet, WalletTransaction } = require('../src/models');

async function refundSpecificBooking() {
  const transaction = await sequelize.transaction();
  try {
    const bookingId = 3; // Explicitly target #3
    const booking = await Booking.findByPk(bookingId, { transaction });

    if (!booking) {
        console.log(`Booking #${bookingId} not found.`);
        await transaction.rollback();
        return;
    }

    const amount = parseFloat(booking.totalPrice || 0);
    const userId = booking.userId;

    console.log(`Processing Refund for Booking #${booking.id} (User: ${userId}, Amount: ${amount})`);

    if (amount > 0) {
        const wallet = await Wallet.findOne({ where: { userId }, transaction });
        if (wallet) {
            await wallet.update({
                balance: parseFloat(wallet.balance) + amount
            }, { transaction });
            
            await WalletTransaction.create({
                walletId: wallet.id,
                amount: amount,
                type: 'refund',
                description: `Manual Refund for Booking #${booking.id}`,
                status: 'completed'
            }, { transaction });
            
            console.log(`> Refunded ₹${amount} to User ${userId}`);
        }
    }

    await booking.destroy({ transaction });
    console.log(`> Deleted Booking #${booking.id}`);

    await transaction.commit();
    console.log('Success.');

  } catch (error) {
    await transaction.rollback();
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

refundSpecificBooking();
