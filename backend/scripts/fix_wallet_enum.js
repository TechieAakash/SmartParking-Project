/**
 * Fix wallet_transactions ENUM to include 'refund'
 * Run: node scripts/fix_wallet_enum.js
 */

const { sequelize } = require('../src/config/database');

async function fixWalletEnum() {
    try {
        console.log('🔄 Connecting to database...');
        await sequelize.authenticate();
        console.log('✅ Connected to database');

        console.log('🔄 Altering wallet_transactions ENUM to include "refund"...');
        
        await sequelize.query(`
            ALTER TABLE wallet_transactions 
            MODIFY COLUMN transaction_type ENUM('credit', 'debit', 'refund') NOT NULL
        `);
        
        console.log('✅ wallet_transactions ENUM updated successfully!');
        console.log('   Now includes: credit, debit, refund');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

fixWalletEnum();
