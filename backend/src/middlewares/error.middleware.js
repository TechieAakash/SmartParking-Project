/**
 * Global Error Handler Middleware
 * Intercepts all errors and provides consistent error responses
 */

const { CustomError } = require('../utils/CustomError');
const config = require('../config/env');

/**
 * Handle Sequelize validation errors
 */
const handleSequelizeValidationError = (err) => {
  const errors = err.errors.map(e => ({
    field: e.path,
    message: e.message,
  }));
  return {
    message: 'Validation failed',
    statusCode: 400,
    errors,
  };
};

/**
 * Handle Sequelize unique constraint errors
 */
const handleSequelizeUniqueError = (err) => {
  const field = err.errors[0].path;
  return {
    message: `${field} already exists`,
    statusCode: 409,
  };
};

/**
 * Handle JWT errors
 */
const handleJWTError = () => {
  return {
    message: 'Invalid token',
    statusCode: 401,
  };
};

const handleJWTExpiredError = () => {
  return {
    message: 'Token expired',
    statusCode: 401,
  };
};

/**
 * Handle JSON parse errors
 */
const handleSyntaxError = () => {
  return {
    message: 'Invalid JSON format',
    statusCode: 400,
  };
};

/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Log error for debugging
  if (config.nodeEnv === 'development') {
    console.error('❌ Error:', err);
  }

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const handled = handleSequelizeValidationError(err);
    error.message = handled.message;
    error.statusCode = handled.statusCode;
    error.errors = handled.errors;
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const handled = handleSequelizeUniqueError(err);
    error.message = handled.message;
    error.statusCode = handled.statusCode;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const handled = handleJWTError();
    error.message = handled.message;
    error.statusCode = handled.statusCode;
  }

  if (err.name === 'TokenExpiredError') {
    const handled = handleJWTExpiredError();
    error.message = handled.message;
    error.statusCode = handled.statusCode;
  }

  // JSON parse errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    const handled = handleSyntaxError();
    error.message = handled.message;
    error.statusCode = handled.statusCode;
  }

  // Send error response
  const response = {
    success: false,
    message: error.message || 'Internal server error',
  };

  if (error.errors) {
    response.errors = error.errors;
  }

  // Include stack trace in development
  if (config.nodeEnv === 'development' && err.stack) {
    response.stack = err.stack;
  }

  res.status(error.statusCode).json(response);
};

/**
 * Handle 404 routes
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
