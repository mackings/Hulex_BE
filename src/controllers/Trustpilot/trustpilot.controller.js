const { getCompanyReviews, getCompanyInfo, formatReviewData } = require('../../helpers/trustpilotApi');

// Simple in-memory cache for reviews to reduce duplicate fetches
const REVIEWS_CACHE = new Map();
const REVIEW_CACHE_TTL_MS = 2 * 24 * 60 * 60 * 1000; // 2 days

function buildCacheKey({ company_domain, locale, date_posted, page }) {
  return `${company_domain}|${locale}|${date_posted}|${page}`;
}

function getCachedReviews(key) {
  const cached = REVIEWS_CACHE.get(key);
  if (!cached) return null;

  if (cached.expiresAt < Date.now()) {
    REVIEWS_CACHE.delete(key);
    return null;
  }
  return cached.data;
}

function setCachedReviews(key, data) {
  REVIEWS_CACHE.set(key, {
    data,
    expiresAt: Date.now() + REVIEW_CACHE_TTL_MS
  });
}

/**
 * Get company reviews from Trustpilot
 * @route GET /trustpilot/reviews
 * @query {string} company_domain - Company domain (required)
 * @query {string} locale - Locale (optional, default: 'en-US')
 * @query {string} date_posted - Date filter (optional, default: 'any')
 * @query {number} page - Page number (optional, default: 1)
 */
exports.getReviews = async (req, res) => {
  try {
    const { company_domain, locale, date_posted, page } = req.query;

    // Validate required parameters
    if (!company_domain) {
      return res.status(400).json({
        success: false,
        error: 'company_domain is required'
      });
    }

    // Validate date_posted parameter if provided
    const validDateFilters = ['any', 'last_week', 'last_month', 'last_year'];
    if (date_posted && !validDateFilters.includes(date_posted)) {
      return res.status(400).json({
        success: false,
        error: `Invalid date_posted value. Must be one of: ${validDateFilters.join(', ')}`
      });
    }

    // Validate page parameter if provided
    if (page && (isNaN(page) || parseInt(page) < 1)) {
      return res.status(400).json({
        success: false,
        error: 'Page must be a positive number'
      });
    }

    const queryParams = {
      company_domain,
      locale: locale || 'en-US',
      date_posted: date_posted || 'any',
      page: page ? parseInt(page) : 1
    };

    // Serve from cache if available and fresh
    const cacheKey = buildCacheKey(queryParams);
    const cached = getCachedReviews(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        ...cached,
        cached: true
      });
    }

    // Fetch reviews from Trustpilot API
    const result = await getCompanyReviews(queryParams);

    if (!result.success) {
      return res.status(result.status || 500).json({
        success: false,
        error: result.error
      });
    }

    // Format and return the data
    const formattedData = formatReviewData(result.data);
    setCachedReviews(cacheKey, formattedData);

    res.json({
      success: true,
      ...formattedData,
      cached: false
    });

  } catch (error) {
    console.error('Get Reviews Error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while fetching reviews'
    });
  }
};

/**
 * Get company information from Trustpilot
 * @route GET /trustpilot/company
 * @query {string} company_domain - Company domain (required)
 */
exports.getCompany = async (req, res) => {
  try {
    const { company_domain } = req.query;

    // Validate required parameters
    if (!company_domain) {
      return res.status(400).json({
        success: false,
        error: 'company_domain is required'
      });
    }

    // Fetch company info from Trustpilot API
    const result = await getCompanyInfo(company_domain);

    if (!result.success) {
      return res.status(result.status || 500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Get Company Error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while fetching company information'
    });
  }
};

/**
 * Get aggregated review statistics
 * @route GET /trustpilot/stats
 * @query {string} company_domain - Company domain (required)
 */
exports.getStats = async (req, res) => {
  try {
    const { company_domain } = req.query;

    if (!company_domain) {
      return res.status(400).json({
        success: false,
        error: 'company_domain is required'
      });
    }

    // Fetch reviews
    const result = await getCompanyReviews({
      company_domain,
      locale: 'en-US',
      date_posted: 'any',
      page: 1
    });

    if (!result.success) {
      return res.status(result.status || 500).json({
        success: false,
        error: result.error
      });
    }

    const reviews = result.data?.data?.reviews || [];

    // Calculate statistics
    const stats = {
      totalReviews: reviews.length,
      averageRating: 0,
      ratingDistribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      },
      verifiedReviews: 0,
      unverifiedReviews: 0
    };

    if (reviews.length > 0) {
      let totalRating = 0;

      reviews.forEach(review => {
        totalRating += review.review_rating;
        stats.ratingDistribution[review.review_rating]++;

        if (review.review_is_verified) {
          stats.verifiedReviews++;
        } else {
          stats.unverifiedReviews++;
        }
      });

      stats.averageRating = (totalRating / reviews.length).toFixed(2);
    }

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get Stats Error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while calculating statistics'
    });
  }
};
