const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../../helpers/emailService');
const User = require('../../models/userModel');



exports.CreateAccount = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, country, address } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate 5-digit OTP
    const verificationOTP = Math.floor(10000 + Math.random() * 90000).toString();
    const verificationOTPExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      country,
      address,
      verificationOTP,
      verificationOTPExpiry,
      isVerified: false
    });

    // Send verification email
    await sendVerificationEmail(email, verificationOTP);

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please check your email for verification code.',
      userId: user._id
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// Verify Email
exports.VerifyEmail = async (req, res) => {
  try {
    const { otp } = req.body;

    const user = await User.findOne({
      verificationOTP: otp,
      verificationOTPExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification code'
      });
    }

    user.isVerified = true;
    user.verificationOTP = undefined;
    user.verificationOTPExpiry = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully. You can now login.'
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// Login with account lockout protection
exports.Login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const clientIp = req.clientIp || req.ip;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
      return res.status(423).json({
        success: false,
        error: `Account is locked due to multiple failed login attempts. Please try again in ${lockTimeRemaining} minutes.`
      });
    }

    // Reset lock if lock period has expired
    if (user.lockUntil && user.lockUntil <= Date.now()) {
      user.loginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();
    }

    // Check if verified
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        error: 'Please verify your email before logging in'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Increment failed login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      // Lock account after 5 failed attempts for 30 minutes
      const MAX_LOGIN_ATTEMPTS = 5;
      const LOCK_TIME = 30 * 60 * 1000; // 30 minutes

      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = Date.now() + LOCK_TIME;
        await user.save();

        console.warn({
          timestamp: new Date().toISOString(),
          type: 'ACCOUNT_LOCKED',
          email: user.email,
          ip: clientIp,
          attempts: user.loginAttempts
        });

        return res.status(423).json({
          success: false,
          error: 'Account locked due to multiple failed login attempts. Please try again in 30 minutes or reset your password.'
        });
      }

      await user.save();

      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        attemptsRemaining: MAX_LOGIN_ATTEMPTS - user.loginAttempts
      });
    }

    // Successful login - reset attempts and update login info
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLoginIP = clientIp;
    user.lastLoginAt = new Date();
    await user.save();

    // Generate JWT with additional security
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRY || '7d',
        issuer: 'hulex-api',
        audience: 'hulex-client'
      }
    );

    // Log successful login
    console.log({
      timestamp: new Date().toISOString(),
      type: 'LOGIN_SUCCESS',
      email: user.email,
      ip: clientIp
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        country: user.country,
        address: user.address,
        lastLogin: user.lastLoginAt
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      error: 'An error occurred during login'
    });
  }
};

// Request Password Reset
exports.RequestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists
      return res.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset code.'
      });
    }

    // Generate 5-digit OTP
    const resetOTP = Math.floor(10000 + Math.random() * 90000).toString();
    const resetOTPExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    user.resetOTP = resetOTP;
    user.resetOTPExpiry = resetOTPExpiry;
    await user.save();

    // Send reset email
    await sendPasswordResetEmail(email, resetOTP);

    res.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset code.'
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// Reset Password
exports.ResetPassword = async (req, res) => {
  try {
    const { otp, newPassword } = req.body;

    const user = await User.findOne({
      resetOTP: otp,
      resetOTPExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset code'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetOTP = undefined;
    user.resetOTPExpiry = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// Resend Verification Email
exports.ResendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email is already verified'
      });
    }

    // Generate new 5-digit OTP
    const verificationOTP = Math.floor(10000 + Math.random() * 90000).toString();
    const verificationOTPExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    user.verificationOTP = verificationOTP;
    user.verificationOTPExpiry = verificationOTPExpiry;
    await user.save();

    // Send verification email
    await sendVerificationEmail(email, verificationOTP);

    res.json({
      success: true,
      message: 'Verification code sent successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};
