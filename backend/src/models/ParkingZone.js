const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ParkingZone = sequelize.define('ParkingZone', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'zone_name', // Explicitly map to snake_case column
    validate: {
      notEmpty: {
        msg: 'Zone name is required'
      },
      len: {
        args: [1, 100],
        msg: 'Zone name cannot exceed 100 characters'
      }
    }
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Address is required'
      }
    }
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
    validate: {
      min: -90,
      max: 90
    }
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
    validate: {
      min: -180,
      max: 180
    }
  },
  totalCapacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'total_capacity',
    validate: {
      min: {
        args: [1],
        msg: 'Capacity must be at least 1'
      },
      max: {
        args: [5000],
        msg: 'Capacity cannot exceed 5000'
      }
    }
  },
  currentOccupancy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'current_occupancy',
    validate: {
      min: 0,
      customValidator(value) {
        if (value > this.totalCapacity) {
          throw new Error('Occupancy cannot exceed total capacity');
        }
      }
    }
  },
  contractorLimit: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'contractor_limit',
    validate: {
      min: {
        args: [1],
        msg: 'Contractor limit must be at least 1'
      },
      customValidator(value) {
        if (value > this.totalCapacity) {
          throw new Error('Contractor limit cannot exceed total capacity');
        }
      }
    }
  },
  contractorName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'contractor_name',
    validate: {
      notEmpty: {
        msg: 'Contractor name is required'
      }
    }
  },
  contractorContact: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'contractor_contact'
  },
  contractorEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'contractor_email',
    validate: {
      isEmail: {
        msg: 'Please enter a valid email'
      }
    }
  },
  hourlyRate: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 50.00,
    field: 'hourly_rate',
    validate: {
      min: {
        args: [0],
        msg: 'Hourly rate cannot be negative'
      }
    }
  },
  penaltyPerVehicle: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 500.00,
    field: 'penalty_per_vehicle',
    validate: {
      min: {
        args: [0],
        msg: 'Penalty cannot be negative'
      }
    }
  },
  operatingHours: {
    type: DataTypes.STRING,
    defaultValue: '06:00 - 22:00',
    field: 'operating_hours'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
    defaultValue: 'active'
  }
}, {
  tableName: 'parking_zones',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeUpdate: (zone) => {
      zone.updatedAt = new Date();
    }
  }
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
