const express = require('express');
const router = express.Router();

const { validateRegister, validateLogin, validateEmail, validateResetPassword } = require('../helpers/authValidators');
const { CreateAccount, Login, RequestPasswordReset, ResetPassword, ResendVerification, VerifyEmail } = require('../controllers/Auth/auth.controller');
const { authMiddleware } = require('../helpers/authService');
const { authLimiter, otpLimiter } = require('../middleware/securityMiddleware');

// ======================
// PUBLIC ROUTES
// ======================

// Registration - Strict rate limiting
router.post('/register', authLimiter, validateRegister, CreateAccount);

// Email verification - OTP rate limiting
router.post('/verify-email', otpLimiter, VerifyEmail);

// Login - Strict rate limiting (most critical endpoint)
router.post('/login', authLimiter, validateLogin, Login);

// Password reset request - OTP rate limiting
router.post('/request-password-reset', otpLimiter, validateEmail, RequestPasswordReset);

// Password reset - Strict rate limiting
router.post('/reset-password', authLimiter, validateResetPassword, ResetPassword);

// Resend verification - OTP rate limiting
router.post('/resend-verification', otpLimiter, validateEmail, ResendVerification);

// ======================
// PROTECTED ROUTES
// ======================

// Get current user profile
router.get('/me', authMiddleware, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

module.exports = router;