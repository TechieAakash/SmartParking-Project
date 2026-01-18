const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.get('/my', authenticate, bookingController.getMyBookings);
router.get('/availability', authenticate, bookingController.checkAvailability);
router.post('/', authenticate, bookingController.createBooking);
router.post('/:id/scan', authenticate, bookingController.scanBooking);
router.post('/:id/cancel', authenticate, bookingController.cancelBooking);

// Subscription Routes
router.post('/subscription', authenticate, bookingController.purchaseSubscription);
router.get('/subscription/my', authenticate, bookingController.getMySubscriptions);
router.post('/subscription/:id/scan', authenticate, bookingController.scanSubscription);
router.post('/subscription/:id/cancel', authenticate, bookingController.cancelSubscription);

module.exports = router;
