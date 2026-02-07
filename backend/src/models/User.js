const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'Username is required'
      },
      len: {
        args: [3, 50],
        msg: 'Username must be between 3 and 50 characters'
      }
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: {
        msg: 'Please enter a valid email'
      },
      notEmpty: {
        msg: 'Email is required'
      }
    }
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'password_hash'
  },
  fullName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'full_name',
    validate: {
      notEmpty: {
        msg: 'Full name is required'
      }
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'officer', 'viewer', 'user', 'driver'),
    allowNull: false,
    defaultValue: 'viewer'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  refreshToken: {
    type: DataTypes.STRING(512),
    allowNull: true,
    field: 'refresh_token'
  },
  mcdGovtId: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'mcd_govt_id'
  },
  officerBadgeId: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true,
    field: 'officer_badge_id',
    validate: {
      isValidBadge(value) {
        if (value && !/^MCD-OFF-\d{4}$/.test(value)) {
          throw new Error('Invalid badge format. Must be MCD-OFF-XXXX');
        }
      }
    }
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_verified'
  },
  verifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'verified_at'
  },
  profilePhoto: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'profile_photo'
  },
  registrationIp: {
    type: DataTypes.STRING(45),
    allowNull: true,
    field: 'registration_ip'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    allowNull: false,
    defaultValue: 'active'
  },
  googleId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
    field: 'google_id'
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_login'
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (user) => {
      if (user.passwordHash && !user.passwordHash.startsWith('$2')) {
        user.passwordHash = await bcrypt.hash(user.passwordHash, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('passwordHash') && !user.passwordHash.startsWith('$2')) {
        user.passwordHash = await bcrypt.hash(user.passwordHash, 10);
      }
    }
  }
});

// Instance method to check password
User.prototype.checkPassword = async function(password) {
  return await bcrypt.compare(password, this.passwordHash);
};

// Instance method to get safe user data (without password)
User.prototype.toSafeObject = function() {
  const user = this.toJSON();
  delete user.passwordHash;
  return user;
};

module.exports = User;
