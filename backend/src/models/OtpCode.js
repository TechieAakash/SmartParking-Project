const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OtpCode = sequelize.define('OtpCode', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  contact: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  code: {
    type: DataTypes.STRING(6),
    allowNull: false
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'otp_codes',
  timestamps: true,
  updatedAt: false // Only need createdAt for audit
});

module.exports = OtpCode;
