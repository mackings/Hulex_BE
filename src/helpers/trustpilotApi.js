const axios = require('axios');

/**
 * Trustpilot API Client
 * Fetches company reviews from Trustpilot via RapidAPI
 */

const RAPIDAPI_HOST = 'trustpilot-company-and-reviews-data.p.rapidapi.com';
const RAPIDAPI_KEY = process.env.TRUSTPILOT_RAPIDAPI_KEY;

/**
 * Fetch company reviews from Trustpilot
 * @param {Object} options - Query options
 * @param {string} options.company_domain - Company domain (e.g., 'lemfi.com')
 * @param {string} options.locale - Locale (default: 'en-US')
 * @param {string} options.date_posted - Date filter ('any', 'last_week', 'last_month', 'last_year')
 * @param {number} options.page - Page number (default: 1)
 * @returns {Promise<Object>} Review data
 */
async function getCompanyReviews(options = {}) {
  try {
    const {
      company_domain,
      locale = 'en-US',
      date_posted = 'any',
      page = 1
    } = options;

    // Validate required parameters
    if (!company_domain) {
      throw new Error('company_domain is required');
    }

    if (!RAPIDAPI_KEY) {
      throw new Error('TRUSTPILOT_RAPIDAPI_KEY is not configured in environment variables');
    }

    // Build query parameters
    const params = {
      company_domain,
      locale,
      date_posted,
      page: page.toString()
    };

    // Make API request
    const response = await axios.get(`https://${RAPIDAPI_HOST}/company-reviews`, {
      params,
      headers: {
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': RAPIDAPI_KEY
      },
      timeout: 10000 // 10 second timeout
    });

    // Return the response data
    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    console.error('Trustpilot API Error:', error.message);

    // Handle specific error types
    if (error.response) {
      // API returned an error response
      return {
        success: false,
        error: error.response.data?.message || 'Failed to fetch reviews',
        status: error.response.status
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        success: false,
        error: 'No response from Trustpilot API. Please try again later.'
      };
    } else {
      // Error in request setup
      return {
        success: false,
        error: error.message
      };
    }
  }
}

/**
 * Fetch company information from Trustpilot
 * @param {string} company_domain - Company domain
 * @returns {Promise<Object>} Company data
 */
async function getCompanyInfo(company_domain) {
  try {
    if (!company_domain) {
      throw new Error('company_domain is required');
    }

    if (!RAPIDAPI_KEY) {
      throw new Error('TRUSTPILOT_RAPIDAPI_KEY is not configured');
    }

    const response = await axios.get(`https://${RAPIDAPI_HOST}/company-info`, {
      params: { company_domain },
      headers: {
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': RAPIDAPI_KEY
      },
      timeout: 10000
    });

    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    console.error('Trustpilot Company Info Error:', error.message);

    if (error.response) {
      return {
        success: false,
        error: error.response.data?.message || 'Failed to fetch company info',
        status: error.response.status
      };
    } else if (error.request) {
      return {
        success: false,
        error: 'No response from Trustpilot API'
      };
    } else {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

/**
 * Format review data for frontend consumption
 * @param {Object} reviewData - Raw review data from API
 * @returns {Object} Formatted review data
 */
function formatReviewData(reviewData) {
  if (!reviewData || !reviewData.data || !reviewData.data.reviews) {
    return {
      reviews: [],
      total: 0,
      page: 1
    };
  }

  const reviews = reviewData.data.reviews.map(review => ({
    id: review.review_id,
    title: review.review_title,
    text: review.review_text,
    rating: review.review_rating,
    isVerified: review.review_is_verified,
    likes: review.review_likes,
    language: review.review_language,
    postedAt: review.review_time,
    experiencedAt: review.review_experienced_time,
    reply: review.reply_text || null,
    consumer: {
      id: review.consumer_id,
      name: review.consumer_name,
      image: review.consumer_image || null,
      reviewCount: review.consumer_review_count,
      country: review.consumer_country,
      isVerified: review.consumer_is_verified
    }
  }));

  return {
    reviews,
    total: reviews.length,
    page: reviewData.parameters?.page || 1,
    requestId: reviewData.request_id
  };
}

module.exports = {
  getCompanyReviews,
  getCompanyInfo,
  formatReviewData
};
