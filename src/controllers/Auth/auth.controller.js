const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../../helpers/emailService');
const User = require('../../models/userModel');



exports.CreateAccount = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

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

// Login
exports.Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
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
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      success: false,
      error: err.message
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