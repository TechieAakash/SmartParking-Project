const { ChatSession, ChatMessage } = require('../models');
const kuroEngine = require('../utils/kuro.engine');
const { successResponse } = require('../utils/response');
const { ValidationError, NotFoundError } = require('../utils/CustomError');

/**
 * Send a message to Kuro and get response
 * Now with fallback mode if database tables don't exist
 */
const sendMessage = async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;
    const userId = req.user?.id || null;

    if (!message || message.trim().length === 0) {
      throw new ValidationError('Message cannot be empty');
    }

    let session = null;
    let useDbMode = true;

    // Try database operations, fallback to stateless if tables don't exist
    try {
      if (sessionId) {
        session = await ChatSession.findByPk(sessionId);
        if (!session) {
          // Create new session if ID not found
          session = await ChatSession.create({
            userId,
            title: message.substring(0, 50) + '...',
            status: 'active'
          });
        }
      } else {
        // Create new session
        session = await ChatSession.create({
          userId,
          title: message.substring(0, 50) + '...',
          status: 'active'
        });
      }

      // Save user message
      await ChatMessage.create({
        sessionId: session.id,
        userId,
        role: 'user',
        content: message.trim()
      });
    } catch (dbError) {
      // Database tables might not exist - use fallback mode
      console.warn('⚠️ Chat DB unavailable, using stateless mode:', dbError.message);
      useDbMode = false;
      session = { id: sessionId || `temp_${Date.now()}` };
    }

    // Process with Kuro AI (always works)
    const aiResponse = await kuroEngine.processMessage(session.id, userId, message);

    // Save bot response if DB available
    if (useDbMode && session.id) {
      try {
        await ChatMessage.create({
          sessionId: session.id,
          userId: null,
          role: 'assistant',
          content: aiResponse.response
        });
      } catch (saveError) {
        console.warn('⚠️ Could not save bot response:', saveError.message);
      }
    }

    successResponse(res, {
      sessionId: session.id,
      message: message.trim(),
      response: aiResponse.response,
      quickReplies: aiResponse.quickReplies,
      intent: aiResponse.intent,
      escalated: aiResponse.intent === 'escalate'
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

    const messages = await ChatMessage.findAll({
      where: { sessionId },
      order: [['created_at', 'ASC']]
    });

    // Transform for frontend which expects 'message' and 'response' format or similar
    // Actually, simpler to just return the messages as they are
    successResponse(res, {
      messages: messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.createdAt
      }))
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

    const session = await ChatSession.findOne({
      where: {
        userId,
        status: 'active'
      },
      order: [['created_at', 'DESC']]
    });

    if (!session) {
      return successResponse(res, { session: null }, 'No active session found');
    }

    const messages = await ChatMessage.findAll({
      where: { sessionId: session.id },
      limit: 20,
      order: [['created_at', 'ASC']]
    });

    successResponse(res, { 
      session,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      }))
    }, 'Active session retrieved successfully');

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
    if (!session) throw new NotFoundError('Chat session not found');

    await session.update({ status: 'archived' });
    successResponse(res, { session }, 'Session ended successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendMessage,
  getChatHistory,
  getActiveSession,
  endSession
};
