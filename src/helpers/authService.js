const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

function extractBearerToken(authHeader) {
  if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7).trim();
  if (!token || token.length > 4096) {
    return null;
  }

  return token;
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET, {
    issuer: 'hulex-api',
    audience: 'hulex-client',
    algorithms: ['HS256'],
    clockTolerance: 30
  });
}

exports.authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please provide a valid token.'
      });
    }

    // Verify token with additional options
    const decoded = verifyAccessToken(token);

    // Check token age - reject if issued too long ago (even if not expired)
    const tokenAge = Date.now() / 1000 - decoded.iat;
    const maxTokenAge = 7 * 24 * 60 * 60; // 7 days in seconds

    if (tokenAge > maxTokenAge) {
      return res.status(401).json({
        success: false,
        error: 'Token has expired. Please login again.'
      });
    }

    if (!decoded.sub || decoded.sub !== String(decoded.userId)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token. Please login again.',
        code: 'TOKEN_INVALID'
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

// Optional auth: attach user if token is valid, otherwise continue without failing
exports.optionalAuth = async (req, res, next) => {
  try {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      return next();
    }

    const decoded = verifyAccessToken(token);

    const tokenAge = Date.now() / 1000 - decoded.iat;
    const maxTokenAge = 7 * 24 * 60 * 60;
    if (tokenAge > maxTokenAge) {
      return next();
    }

    if (!decoded.sub || decoded.sub !== String(decoded.userId)) {
      return next();
    }

    const user = await User.findById(decoded.userId).select('-password -verificationOTP -resetOTP');
    if (!user || (user.lockUntil && user.lockUntil > Date.now()) || !user.isVerified) {
      return next();
    }

    req.user = user;
    req.token = token;
    req.tokenPayload = decoded;
    return next();
  } catch (err) {
    return next();
  }
};
