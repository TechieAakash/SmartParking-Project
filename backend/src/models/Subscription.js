const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Subscription = sequelize.define('Subscription', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    field: 'user_id'
  },
  planId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    field: 'plan_id'
  },
  vehicleId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    field: 'vehicle_id'
  },
  passType: {
    type: DataTypes.ENUM('weekly', 'monthly', 'yearly'),
    allowNull: false,
    field: 'pass_type'
  },
  zoneId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    field: 'zone_id'
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'start_date'
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'end_date'
  },
  status: {
    type: DataTypes.ENUM('active', 'expired', 'cancelled'),
    defaultValue: 'active'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  qrCode: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'qr_code'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'passes',
  timestamps: false,
  underscored: true
});

module.exports = Subscription;
