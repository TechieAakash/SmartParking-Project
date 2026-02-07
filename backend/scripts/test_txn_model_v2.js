const { WalletTransaction } = require('../src/models');
const { sequelize } = require('../src/config/database');

async function testFetch() {
    try {
        const txns = await WalletTransaction.findAll({
            where: { userId: 4 },
            logging: console.log
        });
        console.log('Sequelize found txns:', txns.length);
    } catch (e) {
        console.error('Sequelize error:', e.message);
    } finally {
        process.exit();
    }
}

testFetch();
