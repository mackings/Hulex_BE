

const express = require('express');
const router = express.Router();

const { validateRegister, validateLogin, validateEmail, validateResetPassword } = require('../helpers/authValidators');
const { CreateAccount, Login, RequestPasswordReset, ResetPassword, ResendVerification, VerifyEmail } = require('../controllers/Auth/auth.controller');
const { authMiddleware } = require('../helpers/authService');



// Public routes
router.post('/register', validateRegister, CreateAccount);
router.get('/verify-email', VerifyEmail);
router.post('/login', validateLogin, Login);
router.post('/request-password-reset', validateEmail, RequestPasswordReset);
router.post('/reset-password', validateResetPassword, ResetPassword);
router.post('/resend-verification', validateEmail, ResendVerification);



// Protected route example
router.get('/me', authMiddleware, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

module.exports = router;