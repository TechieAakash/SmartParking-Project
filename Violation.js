const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/database');

const Violation = sequelize.define('Violation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  zone_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'zone_id',
    references: {
      model: 'parking_zones',
      key: 'id'
    }
  },
  severity: {
    type: DataTypes.ENUM('warning', 'critical'),
    allowNull: false,
    defaultValue: 'warning'
  },
  excess_vehicles: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'excess_vehicles',
    defaultValue: 0
  },
  penalty_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'penalty_amount',
    defaultValue: 0
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  resolved: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  resolved_at: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'resolved_at'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  auto_generated: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    field: 'auto_generated',
    defaultValue: true
  }
}, {
  tableName: 'violations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Violation;