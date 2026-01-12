/**
 * Chatbot Routes
 * API endpoints for Kuro AI chatbot
 */

const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbot.controller');
const { optionalAuth, authenticate, authorize } = require('../middlewares/auth.middleware');

// Public/Optional Auth Routes
router.post('/message', optionalAuth, chatbotController.sendMessage);
router.get('/session', optionalAuth, chatbotController.getActiveSession);

// Authenticated Routes
router.get('/history/:sessionId', authenticate, chatbotController.getChatHistory);
router.post('/end/:sessionId', authenticate, chatbotController.endSession);
router.post('/rate/:sessionId', authenticate, chatbotController.rateSession);
router.post('/escalate/:sessionId', authenticate, chatbotController.escalateSession);

// Admin Routes
router.get('/stats', authenticate, authorize('admin'), chatbotController.getChatStats);

module.exports = router;
