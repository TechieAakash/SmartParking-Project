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
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

async function run() {
  try {
    console.log('🔗 Connecting to:', databaseUrl.replace(/:[^:@]*@/, ':****@')); // Hide password in logs
    await sequelize.authenticate();
    console.log('✅ Connection successful!');
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS otp_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        contact VARCHAR(255) NOT NULL,
        code VARCHAR(6) NOT NULL,
        expiresAt DATETIME NOT NULL,
        used BOOLEAN DEFAULT false,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL,
        INDEX idx_contact (contact)
      ) ENGINE=InnoDB;
    `);
    console.log('✅ Table otp_codes created successfully!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await sequelize.close();
  }
}

run();
