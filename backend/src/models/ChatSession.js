const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ChatSession = sequelize.define('ChatSession', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    field: 'user_id'
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'archived', 'deleted'),
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
  tableName: 'chat_sessions',
  timestamps: true,
  underscored: true
});

module.exports = ChatSession;
