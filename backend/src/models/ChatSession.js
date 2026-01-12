/**
 * ChatSession Model
 * Manages chat conversation sessions
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ChatSession = sequelize.define('ChatSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  startedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'started_at'
  },
  endedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'ended_at'
  },
  messageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'message_count'
  },
  satisfactionRating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'satisfaction_rating',
    validate: {
      min: 1,
      max: 5
    }
  },
  escalated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether session was escalated to human agent'
  },
  language: {
    type: DataTypes.ENUM('en', 'hi'),
    defaultValue: 'en'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Session metadata: user_agent, ip_address, etc.'
  }
}, {
  tableName: 'chat_sessions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
});

module.exports = ChatSession;
