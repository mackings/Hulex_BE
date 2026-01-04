const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

exports.authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please provide a valid token.'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token with additional options
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'hulex-api',
      audience: 'hulex-client',
      algorithms: ['HS256'], // Only allow HS256 algorithm
      clockTolerance: 30 // Allow 30 seconds clock skew
    });

    // Check token age - reject if issued too long ago (even if not expired)
    const tokenAge = Date.now() / 1000 - decoded.iat;
    const maxTokenAge = 7 * 24 * 60 * 60; // 7 days in seconds

    if (tokenAge > maxTokenAge) {
      return res.status(401).json({
        success: false,
        error: 'Token has expired. Please login again.'
      });
    }

    // Get user from database
    const user = await User.findById(decoded.userId).select('-password -verificationOTP -resetOTP');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found. Your account may have been deleted.'
      });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(423).json({
        success: false,
        error: 'Account is temporarily locked. Please try again later.'
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        error: 'Email not verified. Please verify your email to continue.'
      });
    }

    // Optional: Track IP changes for suspicious activity
    const currentIp = req.clientIp || req.ip;
    if (user.lastLoginIP && user.lastLoginIP !== currentIp) {
      console.warn({
        timestamp: new Date().toISOString(),
        type: 'IP_CHANGE_DETECTED',
        userId: user._id,
        email: user.email,
        previousIp: user.lastLoginIP,
        currentIp: currentIp
      });
    }

    // Attach user and token info to request
    req.user = user;
    req.token = token;
    req.tokenPayload = decoded;

    next();
  } catch (err) {
    // Handle specific JWT errors
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token has expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token. Please login again.',
        code: 'TOKEN_INVALID'
      });
    }

    if (err.name === 'NotBeforeError') {
      return res.status(401).json({
        success: false,
        error: 'Token not yet valid.',
        code: 'TOKEN_NOT_ACTIVE'
      });
    }

    console.error('Auth middleware error:', err);
    res.status(401).json({
      success: false,
      error: 'Authentication failed. Please login again.'
    });
  }
};