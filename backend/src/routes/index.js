/**
 * Routes Index - Simplified for UI alignment
 * Only includes: Auth, Zones, Violations
 */

const express = require('express');
const router = express.Router();

// Import only required routes
const authRoutes = require('./auth.routes');
const zonesRoutes = require('./zones.routes');
const violationsRoutes = require('./violations.routes');
const chatbotRoutes = require('./chatbot.routes');
const vehicleRoutes = require('./vehicle.routes');
const bookingRoutes = require('./booking.routes');
const walletRoutes = require('./wallet.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/zones', zonesRoutes);
router.use('/violations', violationsRoutes);
router.use('/chat', chatbotRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/bookings', bookingRoutes);
router.use('/wallet', walletRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'MCD Smart Parking API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
