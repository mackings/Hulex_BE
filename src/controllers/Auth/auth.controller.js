const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../../helpers/emailService');
const User = require('../../models/userModel');



// Create Account
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

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      verificationToken,
      verificationTokenExpiry,
      isVerified: false
    });

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
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
    const { token } = req.query;

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification token'
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
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
        message: 'If an account exists with this email, you will receive a password reset link.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 1 * 60 * 60 * 1000; // 1 hour

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // Send reset email
    await sendPasswordResetEmail(email, resetToken);

    res.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.'
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
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
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

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = verificationTokenExpiry;
    await user.save();

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};