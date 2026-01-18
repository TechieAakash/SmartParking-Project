const { WalletTransaction } = require('../src/models');

async function testFetch() {
    try {
        const txns = await WalletTransaction.findAll({
            where: { userId: 4 }
        });
        console.log('Sequelize found txns:', txns.length);
        if (txns.length > 0) {
            console.log('Sample txn:', txns[0].toJSON());
        }
    } catch (e) {
        console.error('Sequelize error:', e.message);
    } finally {
        process.exit();
    }
}

testFetch();
