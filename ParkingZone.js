const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/database');

const ParkingZone = sequelize.define('ParkingZone', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
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
  total_capacity: {
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
  current_occupancy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'current_occupancy',
    validate: {
      min: 0,
      customValidator(value) {
        if (value > this.total_capacity) {
          throw new Error('Occupancy cannot exceed total capacity');
        }
      }
    }
  },
  contractor_limit: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'contractor_limit',
    validate: {
      min: {
        args: [1],
        msg: 'Contractor limit must be at least 1'
      },
      customValidator(value) {
        if (value > this.total_capacity) {
          throw new Error('Contractor limit cannot exceed total capacity');
        }
      }
    }
  },
  contractor_name: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'contractor_name',
    validate: {
      notEmpty: {
        msg: 'Contractor name is required'
      }
    }
  },
  contractor_contact: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'contractor_contact'
  },
  contractor_email: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'contractor_email',
    validate: {
      isEmail: {
        msg: 'Please enter a valid email'
      }
    }
  },
  hourly_rate: {
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
  penalty_per_vehicle: {
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
  operating_hours: {
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
  const occupancy = this.current_occupancy || this.currentOccupancy || 0;
  const capacity = this.total_capacity || this.totalCapacity || 1;
  return (occupancy / capacity) * 100;
};

ParkingZone.prototype.getViolationStatus = function() {
  const occupancy = this.current_occupancy || this.currentOccupancy || 0;
  const limit = this.contractor_limit || this.contractorLimit || 0;
  if (occupancy > limit) {
    return 'critical';
  } else if (occupancy > limit * 0.85) {
    return 'warning';
  }
  return 'normal';
};

ParkingZone.prototype.getExcessVehicles = function() {
  const occupancy = this.current_occupancy || this.currentOccupancy || 0;
  const limit = this.contractor_limit || this.contractorLimit || 0;
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
    const occupancy = zone.current_occupancy || zone.currentOccupancy || 0;
    const limit = zone.contractor_limit || zone.contractorLimit || 0;
    return occupancy > limit;
  });
};

module.exports = ParkingZone;