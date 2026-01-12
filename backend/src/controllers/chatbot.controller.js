/**
 * Chatbot Controller  
 * Handles Kuro AI chatbot interactions
 */

const { ChatSession, ChatMessage, User } = require('../models');
const kuroEngine = require('../utils/kuro.engine');
const { successResponse } = require('../utils/response');
const { ValidationError, NotFoundError } = require('../utils/CustomError');

/**
 * Send a message to Kuro and get response
 */
const sendMessage = async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;
    const userId = req.user?.id || null;

    if (!message || message.trim().length === 0) {
      throw new ValidationError('Message cannot be empty');
    }

    if (message.length > 1000) {
      throw new ValidationError('Message too long (max 1000 characters)');
    }

    let session;

    // Get or create session
    if (sessionId) {
      session = await ChatSession.findByPk(sessionId);
      if (!session) {
        throw new NotFoundError('Chat session not found');
      }
    } else {
      // Create new session
      const language = kuroEngine.detectLanguage(message);
      session = await ChatSession.create({
        userId,
        language,
        metadata: {
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip
        }
      });
    }

    // Process message with Kuro AI
    const aiResponse = await kuroEngine.processMessage(session.id, userId, message);

    // Save message and response to database
    const chatMessage = await ChatMessage.create({
      sessionId: session.id,
      userId,
      message: message.trim(),
      response: aiResponse.response,
      intent: aiResponse.intent,
      confidence: aiResponse.confidence,
      language: aiResponse.language,
      metadata: {
        quickReplies: aiResponse.quickReplies
      }
    });

    // Update session message count
    await session.increment('messageCount');

    // Check if escalation is needed
    const shouldEscalate = aiResponse.intent === 'escalate';
    if (shouldEscalate) {
      await session.update({ escalated: true });
    }

    successResponse(res, {
      sessionId: session.id,
      message: chatMessage.message,
      response: aiResponse.response,
      quickReplies: aiResponse.quickReplies,
      intent: aiResponse.intent,
      confidence: aiResponse.confidence,
      language: aiResponse.language,
      escalated: shouldEscalate
    }, 'Message processed successfully');

  } catch (error) {
    next(error);
  }
};

/**
 * Get chat history for a session
 */
const getChatHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const session = await ChatSession.findByPk(sessionId, {
      include: [{
        model: ChatMessage,
        as: 'messages',
        order: [['timestamp', 'ASC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      }]
    });

    if (!session) {
      throw new NotFoundError('Chat session not found');
    }

    successResponse(res, {
      session: {
        id: session.id,
        startedAt: session.startedAt,
        messageCount: session.messageCount,
        language: session.language
      },
      messages: session.messages,
      hasMore: session.messageCount > (parseInt(offset) + parseInt(limit))
    }, 'Chat history retrieved successfully');

  } catch (error) {
    next(error);
  }
};

/**
 * Get active chat session for user
 */
const getActiveSession = async (req, res, next) => {
  try {
    const userId = req.user?.id || null;

    // Find most recent active session (not ended)
    const session = await ChatSession.findOne({
      where: {
        userId,
        endedAt: null
      },
      order: [['startedAt', 'DESC']],
      include: [{
        model: ChatMessage,
        as: 'messages',
        limit: 10,
        order: [['timestamp', 'DESC']]
      }]
    });

    if (!session) {
      return successResponse(res, { session: null }, 'No active session found');
    }

    successResponse(res, { session }, 'Active session retrieved successfully');

  } catch (error) {
    next(error);
  }
};

/**
 * End a chat session
 */
const endSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await ChatSession.findByPk(sessionId);
    if (!session) {
      throw new NotFoundError('Chat session not found');
    }

    await session.update({ endedAt: new Date() });

    successResponse(res, { session }, 'Session ended successfully');

  } catch (error) {
    next(error);
  }
};

/**
 * Rate a chat session
 */
const rateSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      throw new ValidationError('Rating must be between 1 and 5');
    }

    const session = await ChatSession.findByPk(sessionId);
    if (!session) {
      throw new NotFoundError('Chat session not found');
    }

    await session.update({ satisfactionRating: rating });

    successResponse(res, { session }, 'Rating submitted successfully');

  } catch (error) {
    next(error);
  }
};

/**
 * Escalate session to human agent
 */
const escalateSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { reason } = req.body;

    const session = await ChatSession.findByPk(sessionId);
    if (!session) {
      throw new NotFoundError('Chat session not found');
    }

    await session.update({
      escalated: true,
      metadata: {
        ...session.metadata,
        escalationReason: reason,
        escalatedAt: new Date()
      }
    });

    successResponse(res, {
      session,
      message: 'Your request has been escalated to our support team. They will contact you shortly.'
    }, 'Session escalated successfully');

  } catch (error) {
    next(error);
  }
};

/**
 * Get chatbot statistics (admin only)
 */
const getChatStats = async (req, res, next) => {
  try {
    const { Op } = require('sequelize');
    const { sequelize } = require('../models');

    const stats = await ChatSession.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalSessions'],
        [sequelize.fn('AVG', sequelize.col('message_count')), 'avgMessagesPerSession'],
        [sequelize.fn('AVG', sequelize.col('satisfaction_rating')), 'avgRating'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN escalated = 1 THEN 1 ELSE 0 END')), 'escalatedCount']
      ],
      raw: true
    });

    const languageStats = await ChatSession.findAll({
      attributes: [
        'language',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['language'],
      raw: true
    });

    const topIntents = await ChatMessage.findAll({
      attributes: [
        'intent',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['intent'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 10,
      raw: true
    });

    successResponse(res, {
      overall: stats[0],
      byLanguage: languageStats,
      topIntents
    }, 'Chat statistics retrieved successfully');

  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendMessage,
  getChatHistory,
  getActiveSession,
  endSession,
  rateSession,
  escalateSession,
  getChatStats
};
