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

async function addRefreshTokenColumn() {
  try {
    console.log('🔗 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connection successful!');
    
    console.log('🔄 Adding refresh_token column to users table...');
    await sequelize.query(`
      ALTER TABLE users
      ADD COLUMN refresh_token VARCHAR(512) NULL;
    `);
    
    console.log('✅ Column refresh_token added successfully!');
  } catch (err) {
    if (err.parent && err.parent.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠️ Column refresh_token already exists.');
    } else {
      console.error('❌ Error:', err.message);
    }
  } finally {
    await sequelize.close();
  }
}

addRefreshTokenColumn();
