/**
 * Setting Model - Based on user's new SQL schema
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Setting = sequelize.define('Setting', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  settingKey: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false,
    field: 'setting_key',
  },
  settingValue: {
    type: DataTypes.TEXT,
    field: 'setting_value',
  },
  settingType: {
    type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
    defaultValue: 'string',
    field: 'setting_type',
  },
  category: {
    type: DataTypes.STRING(50),
    defaultValue: 'general',
  },
  description: {
    type: DataTypes.TEXT,
  }
}, {
  tableName: 'settings',
  timestamps: false,
  underscored: true,
});

module.exports = Setting;
