const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ParkingSlot = sequelize.define('ParkingSlot', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  zoneId: {
    type: DataTypes.INTEGER,
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
  status: {
    type: DataTypes.ENUM('available', 'occupied', 'maintenance', 'reserved'),
    defaultValue: 'available'
  },
  type: {
    type: DataTypes.ENUM('car', 'bike', 'ev', 'handicapped'),
    defaultValue: 'car'
  },
  sensorId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'sensor_id'
  }
}, {
  tableName: 'parking_slots',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = ParkingSlot;
