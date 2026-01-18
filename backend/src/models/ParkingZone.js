const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ParkingZone = sequelize.define('ParkingZone', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: false
  },
  longitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: false
  },
  totalCapacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'total_capacity'
  },
  currentOccupancy: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'current_occupancy'
  },
  contractorLimit: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'contractor_limit'
  },
  contractorName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'contractor_name'
  },
  contractorContact: {
    type: DataTypes.STRING(20),
    field: 'contractor_contact'
  },
  contractorEmail: {
    type: DataTypes.STRING(100),
    field: 'contractor_email'
  },
  hourlyRate: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 50.00,
    field: 'hourly_rate'
  },
  penaltyPerVehicle: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 500.00,
    field: 'penalty_per_vehicle'
  },
  operatingHours: {
    type: DataTypes.STRING(50),
    defaultValue: '06:00 - 22:00',
    field: 'operating_hours'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
    defaultValue: 'active'
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
  tableName: 'parking_zones',
  timestamps: true,
  underscored: true
});

// Instance methods
ParkingZone.prototype.getOccupancyPercentage = function() {
  const occupancy = this.currentOccupancy || 0;
  const capacity = this.totalCapacity || 1;
  return (occupancy / capacity) * 100;
};

ParkingZone.prototype.getViolationStatus = function() {
  const occupancy = this.currentOccupancy || 0;
  const limit = this.contractorLimit || 0;
  if (occupancy > limit) {
    return 'critical';
  } else if (occupancy > limit * 0.85) {
    return 'warning';
  }
  return 'normal';
};

ParkingZone.prototype.getExcessVehicles = function() {
  const occupancy = this.currentOccupancy || 0;
  const limit = this.contractorLimit || 0;
  return Math.max(0, occupancy - limit);
};

// Static methods
ParkingZone.findViolations = async function() {
  const zones = await this.findAll({
    where: {
      status: 'active'
    }
  });
  
  return zones.filter(zone => {
    return zone.currentOccupancy > zone.contractorLimit;
  });
};

module.exports = ParkingZone;
