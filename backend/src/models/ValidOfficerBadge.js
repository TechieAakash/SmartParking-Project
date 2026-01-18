const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ValidOfficerBadge = sequelize.define('ValidOfficerBadge', {
  badgeId: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false,
    field: 'badge_id'
  },
  isClaimed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_claimed'
  },
  claimedBy: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    field: 'claimed_by'
  }
}, {
  tableName: 'valid_officer_badges',
  timestamps: false,
  underscored: true
});

module.exports = ValidOfficerBadge;
