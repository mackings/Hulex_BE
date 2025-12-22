const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

exports.authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        error: 'Email not verified'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};