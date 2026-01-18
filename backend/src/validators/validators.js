/**
 * Validation Schemas - Updated for new database schema
 */

const { body, param, query } = require('express-validator');

// Auth validators
const registerValidator = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ max: 100 })
    .withMessage('Full name must not exceed 100 characters'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Invalid phone number format'),
];

const loginValidator = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Email or username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// Zone validators
const createZoneValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Zone name is required')
    .isLength({ max: 100 })
    .withMessage('Zone name must not exceed 100 characters'),
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required'),
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('totalCapacity')
    .isInt({ min: 0 })
    .withMessage('Total capacity must be a positive number'),
];

// Booking validators
const createBookingValidator = [
  body('slotId')
    .isInt()
    .withMessage('Slot ID must be a valid integer'),
  body('bookingStart')
    .isISO8601()
    .withMessage('Invalid booking start time format'),
  body('bookingEnd')
    .isISO8601()
    .withMessage('Invalid booking end time format'),
  body('bookingType')
    .optional()
    .isIn(['hourly', 'daily', 'monthly', 'yearly'])
    .withMessage('Invalid booking type'),
];

// Penalty validators
const createPenaltyValidator = [
  body('userId')
    .isInt()
    .withMessage('User ID must be a valid integer'),
  body('bookingId')
    .optional()
    .isInt()
    .withMessage('Booking ID must be a valid integer'),
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Reason is required'),
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
];

// Support ticket validators
const createTicketValidator = [
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ max: 150 })
    .withMessage('Subject must not exceed 150 characters'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required'),
];

// ID parameter validator
const idValidator = [
  param('id')
    .isInt()
    .withMessage('ID must be a valid integer'),
];

module.exports = {
  registerValidator,
  loginValidator,
  createZoneValidator,
  createBookingValidator,
  createPenaltyValidator,
  createTicketValidator,
  idValidator,
};
