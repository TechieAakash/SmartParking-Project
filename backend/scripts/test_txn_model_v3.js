const { WalletTransaction } = require('../src/models');
const { sequelize } = require('../src/config/database');

async function testFetch() {
    try {
        const txns = await WalletTransaction.findAll({
            where: { userId: 4 }
        });
        console.log('Sequelize found txns:', txns.length);
    } catch (e) {
        console.log('--- ERROR ---');
        console.log(e.sql);
        console.log('--- MSG ---');
        console.error(e.message);
    } finally {
        process.exit();
    }
}

testFetch();
