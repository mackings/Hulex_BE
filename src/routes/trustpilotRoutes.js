const express = require('express');
const router = express.Router();

const { getReviews, getCompany, getStats } = require('../controllers/Trustpilot/trustpilot.controller');
const { authMiddleware } = require('../helpers/authService');

// ======================
// TRUSTPILOT ROUTES
// ======================

// Get company reviews (Protected - requires authentication)
router.get('/trustpilot/reviews', authMiddleware, getReviews);

// Get company information (Protected - requires authentication)
router.get('/trustpilot/company', authMiddleware, getCompany);

// Get review statistics (Protected - requires authentication)
router.get('/trustpilot/stats', authMiddleware, getStats);

module.exports = router;
