const { sequelize } = require('../db/database');
const ParkingZone = require('./ParkingZone');
const Violation = require('./Violation');
const User = require('./User');

// Define associations
ParkingZone.hasMany(Violation, {
  foreignKey: 'zone_id',
  as: 'violations',
  onDelete: 'CASCADE'
});

Violation.belongsTo(ParkingZone, {
  foreignKey: 'zone_id',
  as: 'zone'
});

// Export models
module.exports = {
  sequelize,
  ParkingZone,
  Violation,
  User
};