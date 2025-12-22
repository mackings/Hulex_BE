const { body, validationResult } = require('express-validator');

// Validation error handler
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    });
  }
  next();
};

// Register validation
exports.validateRegister = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2 })
    .withMessage('First name must be at least 2 characters long'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2 })
    .withMessage('Last name must be at least 2 characters long'),
  this.handleValidationErrors
];

// Login validation
exports.validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  this.handleValidationErrors
];

// Reset password validation
exports.validateResetPassword = [
  body('otp')
    .notEmpty()
    .withMessage('Reset code is required')
    .isLength({ min: 5, max: 5 })
    .withMessage('Reset code must be 5 digits')
    .isNumeric()
    .withMessage('Reset code must be numeric'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  this.handleValidationErrors
];

// Verify email validation
exports.validateVerifyEmail = [
  body('otp')
    .notEmpty()
    .withMessage('Verification code is required')
    .isLength({ min: 5, max: 5 })
    .withMessage('Verification code must be 5 digits')
    .isNumeric()
    .withMessage('Verification code must be numeric'),
  this.handleValidationErrors
];

// Email validation
exports.validateEmail = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  this.handleValidationErrors
];