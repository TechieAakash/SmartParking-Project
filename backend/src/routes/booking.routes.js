const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.get('/my', authenticate, bookingController.getMyBookings);
router.get('/availability', authenticate, bookingController.checkAvailability);
router.post('/', authenticate, bookingController.createBooking);

// Subscription Routes
router.post('/subscription', authenticate, bookingController.purchaseSubscription);
router.get('/subscription/my', authenticate, bookingController.getMySubscriptions);

module.exports = router;
