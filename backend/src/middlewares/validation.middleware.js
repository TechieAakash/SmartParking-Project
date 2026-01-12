/**
 * Validation Middleware
 * Request validation using express-validator
 */

const { validationResult } = require('express-validator');
const { ValidationError } = require('../utils/CustomError');

/**
 * Validate request and return errors if any
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.param || err.path,
      message: err.msg,
    }));
    
    throw new ValidationError('Validation failed', formattedErrors);
  }
  
  next();
};

module.exports = validate;
