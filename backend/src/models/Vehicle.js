const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Vehicle = sequelize.define('Vehicle', {
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
  licensePlate: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    field: 'license_plate'
  },
  vehicleType: {
    type: DataTypes.ENUM('car', 'bike', 'ev', 'truck', 'bus'),
    defaultValue: 'car',
    field: 'vehicle_type'
  },
  make: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  model: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  color: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'vehicles',
  timestamps: true,
  underscored: true
});

module.exports = Vehicle;
