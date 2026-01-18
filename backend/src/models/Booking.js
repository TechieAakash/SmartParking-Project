const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Booking = sequelize.define('Booking', {
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
  zoneId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    field: 'zone_id'
  },
  // Use slot_id for database but accept zoneId from frontend
  slotId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    field: 'slot_id'
  },
  vehicleId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    field: 'vehicle_id'
  },
  bookingStart: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'booking_start'
  },
  bookingEnd: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'booking_end'
  },
  entryTime: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'entry_time'
  },
  bookingType: {
    type: DataTypes.ENUM('hourly', 'daily', 'monthly', 'yearly'),
    defaultValue: 'hourly',
    field: 'booking_type'
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'cancelled', 'expired'),
    defaultValue: 'active'
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    field: 'total_price'
  }
}, {
  tableName: 'bookings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
});

module.exports = Booking;
