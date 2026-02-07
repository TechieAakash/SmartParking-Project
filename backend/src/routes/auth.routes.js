/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, requestOTP, verifyOTP, refresh, socialLogin } = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const { registerValidator, loginValidator } = require('../validators/validators');

// Public routes
router.post('/register', registerValidator, validate, register);
router.post('/login', loginValidator, validate, login);
router.post('/request-otp', requestOTP);
router.post('/verify-otp', verifyOTP);
router.post('/refresh-token', refresh);
router.post('/social-login', socialLogin);

// Protected routes
router.get('/profile', authenticate, getProfile);
const upload = require('../middlewares/upload.middleware');
router.put('/profile', authenticate, upload.single('profilePhoto'), updateProfile);

module.exports = router;
