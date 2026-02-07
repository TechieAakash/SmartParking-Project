/**
 * Database Configuration for Railway
 * Sequelize setup with Railway MySQL support
 */

const { Sequelize } = require('sequelize');
const config = require('./env');

// Railway provides MYSQL_URL which is the complete connection string
// Format: mysql://user:password@host:port/database
let sequelize;

if (process.env.MYSQL_URL) {
  // Use Railway's MYSQL_URL for production
  console.log('🔗 Connecting to Railway MySQL using MYSQL_URL');
  // Mask password for logging if it's a string
  if (typeof process.env.MYSQL_URL === 'string' && process.env.MYSQL_URL.includes(':')) {
    const maskedUrl = process.env.MYSQL_URL.replace(/:([^:@]+)@/, ':****@');
    console.log('DEBUG MYSQL_URL:', maskedUrl);
  }
  sequelize = new Sequelize(process.env.MYSQL_URL, {
    dialect: 'mysql',
    logging: false, // Disable logging in production
    
    // Connection pool configuration for Railway
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

    // Retry configuration for Railway
    retry: {
      max: 3,
    },

    // Disable SSL warnings for Railway
    dialectOptions: {
      ssl: {
        require: false,
        rejectUnauthorized: false
      }
    }
  });
} else {
  // Fallback to individual environment variables (for local development)
  console.log('🔗 Connecting using individual database credentials');
  console.log('DEBUG DB Config:', config.database);
  sequelize = new Sequelize(
    config.database.name,
    config.database.user,
    config.database.password,
    {
      host: config.database.host,
      port: config.database.port,
      dialect: 'mysql',
      logging: config.nodeEnv === 'development' ? console.log : false,
      
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },

      timezone: '+05:30',

      define: {
        freezeTableName: true,
        timestamps: true,
        underscored: true,
      },

      retry: {
        max: 3,
      },
    }
  );
}

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
