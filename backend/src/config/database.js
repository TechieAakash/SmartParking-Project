/**
 * Database Configuration
 * Sequelize setup with connection pooling and error handling
 */

const { Sequelize } = require('sequelize');
const config = require('./env');

const sequelize = new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: 'mysql',
    logging: config.nodeEnv === 'development' ? console.log : false,
    
    // Connection pool configuration
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },

    // Timezone configuration
    timezone: '+05:30',

    // Prevent naming conflicts
    define: {
      freezeTableName: true,
      timestamps: true,
      underscored: true,
    },

    // SSL configuration for Cloud Databases
    dialectOptions: {
      ssl: config.database.host !== 'localhost' ? {
        rejectUnauthorized: false
      } : null
    },

    // Retry configuration
    retry: {
      max: 3,
    },
  }
);

/**
 * Test database connection
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    console.log(`📊 Connected to: ${config.database.name}@${config.database.host}:${config.database.port}`);
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    return false;
  }
};

/**
 * Sync database models
 */
const syncDatabase = async (options = {}) => {
  try {
    await sequelize.sync(options);
    console.log('✅ Database synchronized');
    
    // Seed Valid Officer Badges
    const ValidOfficerBadge = require('../models/ValidOfficerBadge');
    const existingCount = await ValidOfficerBadge.count();
    
    if (existingCount === 0) {
      console.log('🌱 Seeding Valid Officer Badges...');
      const badges = [];
      for (let i = 1001; i <= 1050; i++) {
        badges.push({ badgeId: `MCD-OFF-${i}` });
      }
      await ValidOfficerBadge.bulkCreate(badges);
      console.log('✅ Seeded 50 Officer Badges');
    }
  } catch (error) {
    console.error('❌ Database sync failed:', error.message);
    throw error;
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
};
