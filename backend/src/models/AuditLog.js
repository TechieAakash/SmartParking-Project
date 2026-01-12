/**
 * Audit Log Model - Based on user's new SQL schema
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER.UNSIGNED,
    field: 'user_id',
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  tableName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'table_name',
  },
  recordId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    field: 'record_id',
  },
  oldValues: {
    type: DataTypes.JSON,
    field: 'old_values',
  },
  newValues: {
    type: DataTypes.JSON,
    field: 'new_values',
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    field: 'ip_address',
  },
  userAgent: {
    type: DataTypes.TEXT,
    field: 'user_agent',
  }
}, {
  tableName: 'audit_logs',
  timestamps: true,
  updatedAt: false, // Audit logs are usually immutable
  underscored: true,
});

module.exports = AuditLog;
