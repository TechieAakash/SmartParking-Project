/**
 * ChatMessage Model
 * Stores individual chat messages and bot responses
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ChatMessage = sequelize.define('ChatMessage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  sessionId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'session_id',
    references: {
      model: 'chat_sessions',
      key: 'id'
    }
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
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  response: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  intent: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Detected intent: faq, help, violation_query, payment, etc.'
  },
  confidence: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Confidence score of intent detection (0-1)'
  },
  language: {
    type: DataTypes.ENUM('en', 'hi'),
    defaultValue: 'en'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional metadata: quick_replies, attachments, etc.'
  }
}, {
  tableName: 'chat_messages',
  timestamps: true,
  createdAt: 'timestamp',
  updatedAt: false,
  underscored: true
});

module.exports = ChatMessage;
