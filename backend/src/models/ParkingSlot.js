const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ParkingSlot = sequelize.define('ParkingSlot', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  zoneId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    field: 'zone_id',
    references: {
      model: 'parking_zones',
      key: 'id'
    }
  },
  slotNumber: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'slot_number'
  },
  slotType: {
    type: DataTypes.ENUM('car', 'bike', 'ev', 'disabled'),
    defaultValue: 'car',
    field: 'slot_type'
  },
  status: {
    type: DataTypes.ENUM('available', 'occupied', 'maintenance'),
    defaultValue: 'available'
  }
}, {
  tableName: 'parking_slots',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = ParkingSlot;
