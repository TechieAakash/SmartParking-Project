const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ChatMessage = sequelize.define('ChatMessage', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  sessionId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    field: 'session_id'
  },
  userId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    field: 'user_id'
  },
  role: {
    type: DataTypes.ENUM('user', 'assistant', 'system'),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'chat_messages',
  timestamps: false,
  underscored: true
});

module.exports = ChatMessage;
