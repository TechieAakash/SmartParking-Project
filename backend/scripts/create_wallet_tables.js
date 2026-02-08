const { Sequelize } = require('sequelize');

// User provided connection string
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// User provided connection string
const databaseUrl = process.env.MYSQL_URL;

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'mysql',
  logging: console.log,
  dialectOptions: {
    connectTimeout: 60000,
    ssl: {
      require: false,
      rejectUnauthorized: false
    }
  }
});

async function createWalletTables() {
  try {
    console.log('🔗 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connection successful!');

    console.log('🛠 Creating `wallets` table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNSIGNED NOT NULL UNIQUE,
        balance DECIMAL(10, 2) DEFAULT 0.00,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
    console.log('✅ `wallets` table created.');

    console.log('🛠 Creating `wallet_transactions` table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNSIGNED NOT NULL,
        wallet_id INT UNSIGNED NOT NULL,
        transaction_type ENUM('credit', 'debit', 'refund') NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        balance_after DECIMAL(10, 2) NOT NULL,
        description VARCHAR(255) NULL,
        reference_id VARCHAR(100) NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
    console.log('✅ `wallet_transactions` table created.');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await sequelize.close();
  }
}

createWalletTables();
