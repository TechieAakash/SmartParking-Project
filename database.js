const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'smartparking',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || 'admin123',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    },
    dialectOptions: {
      connectTimeout: 60000,
      decimalNumbers: true
    }
  }
);

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connection established successfully.');
    console.log(`📊 Database: ${process.env.DB_NAME || 'smartparking'}`);
    console.log(`🏠 Host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
    
    // Sync all models with database
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ All models synchronized with MySQL database.');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to MySQL database:', error.message);
    console.log('💡 Troubleshooting tips:');
    console.log('   1. Make sure MySQL service is running');
    console.log('   2. Check your username and password');
    console.log('   3. Verify database exists: CREATE DATABASE IF NOT EXISTS smartparking;');
    console.log('   4. Check MySQL user permissions');
    
    return false;
  }
};

module.exports = { sequelize, testConnection };