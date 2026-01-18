const { sequelize, Booking, Wallet, WalletTransaction } = require('../src/models');
const { Op } = require('sequelize');
const fs = require('fs');

async function refundAllInvalid() {
  const transaction = await sequelize.transaction();
  const logFile = 'cleanup_log.txt';
  
  try {
    // Find ALL invalid bookings (High Price)
    // Note: Use string comparison or cast if needed, but DECIMAL should support Op.gt
    const invalidBookings = await Booking.findAll({
      where: {
        totalPrice: { [Op.gt]: 2000 }
      },
      transaction
    });

    const msg = `Found ${invalidBookings.length} invalid bookings (Price > 2000).`;
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');

    for (const booking of invalidBookings) {
        const amount = parseFloat(booking.totalPrice) || 0;
        const userId = booking.userId;

        console.log(`Processing Refund for Booking #${booking.id} (Amount: ${amount})`);

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
                    description: `System Refund for Invalid Booking #${booking.id}`,
                    status: 'completed'
                }, { transaction });
                
                fs.appendFileSync(logFile, `Refunded ${amount} for Booking #${booking.id}\n`);
            }
        }

        await booking.destroy({ transaction });
        fs.appendFileSync(logFile, `Deleted Booking #${booking.id}\n`);
    }

    await transaction.commit();
    console.log('Cleanup Complete.');

  } catch (error) {
    await transaction.rollback();
    console.error('Error:', error);
    fs.appendFileSync(logFile, `Error: ${error.message}\n`);
  } finally {
    await sequelize.close();
  }
}

refundAllInvalid();
