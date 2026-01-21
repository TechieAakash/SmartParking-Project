/**
 * Environment Configuration
 * Validates and exports environment variables with fail-fast behavior
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Railway provides MySQL environment variables, fall back to DB_* for local development
const isRailway = process.env.RAILWAY_ENVIRONMENT !== undefined;

const requiredEnvVars = isRailway 
  ? ['JWT_SECRET']  // Railway auto-provides MySQL vars
  : ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];

// Validate required environment variables
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('Please check your .env file or Railway environment variables');
  process.exit(1);
}

const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,

  // Database - Support both Railway and local environment variables
  database: {
    host: process.env.MYSQLHOST || process.env.DB_HOST,
    port: parseInt(process.env.MYSQLPORT || process.env.DB_PORT, 10) || 3306,
    name: process.env.MYSQLDATABASE || process.env.DB_NAME,
    user: process.env.MYSQLUSER || process.env.DB_USER,
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expire: process.env.JWT_EXPIRE || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    refreshExpire: process.env.JWT_REFRESH_EXPIRE || '30d',
  },

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // OpenAI AI
  openai: {
    apiKey: process.env.OPENAI_API_KEY
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
};

module.exports = config;
