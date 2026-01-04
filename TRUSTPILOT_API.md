# Trustpilot API Integration

This document explains how to use the Trustpilot API integration in HulexBE.

## Overview

The Trustpilot API allows you to fetch company reviews and information from Trustpilot. This integration uses the RapidAPI platform.

## Setup

1. **Add API Key to Environment**
   ```bash
   TRUSTPILOT_RAPIDAPI_KEY=your_rapidapi_key_here
   ```

2. **API Key is Already Configured**
   - Your API key has been added to `.env`
   - The key is: `4d3203bd54mshae69b36a7cd471fp12e74fjsn565cea5d6fdd`

## Available Endpoints

All Trustpilot endpoints require authentication (JWT token).

### 1. Get Company Reviews

**Endpoint:** `GET /trustpilot/reviews`

**Authentication:** Required (Bearer Token)

**Query Parameters:**
- `company_domain` (required) - Company domain (e.g., "lemfi.com")
- `locale` (optional) - Locale code (default: "en-US")
- `date_posted` (optional) - Date filter: "any", "last_week", "last_month", "last_year" (default: "any")
- `page` (optional) - Page number (default: 1)

**Example Request:**
```bash
curl --request GET \
  --url 'http://localhost:1000/trustpilot/reviews?company_domain=lemfi.com&date_posted=any&locale=en-US&page=1' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

**Example Response:**
```json
{
  "success": true,
  "reviews": [
    {
      "id": "64b6b0a199902cc2c83cf5b0",
      "title": "Great service!",
      "text": "I had a wonderful experience...",
      "rating": 5,
      "isVerified": false,
      "likes": 0,
      "language": "en",
      "postedAt": "2023-07-18T17:32:49.000Z",
      "experiencedAt": "2023-07-10T00:00:00.000Z",
      "reply": "Thank you for your feedback...",
      "consumer": {
        "id": "64b6b086ec348200138350b5",
        "name": "John Doe",
        "image": null,
        "reviewCount": 1,
        "country": "US",
        "isVerified": false
      }
    }
  ],
  "total": 5,
  "page": 1,
  "requestId": "8ba84925-1353-4826-937b-e5378127ea99"
}
```

---

### 2. Get Company Information

**Endpoint:** `GET /trustpilot/company`

**Authentication:** Required (Bearer Token)

**Query Parameters:**
- `company_domain` (required) - Company domain (e.g., "lemfi.com")

**Example Request:**
```bash
curl --request GET \
  --url 'http://localhost:1000/trustpilot/company?company_domain=lemfi.com' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "company_name": "Lemfi",
    "company_domain": "lemfi.com",
    "trust_score": 4.5,
    "total_reviews": 1234,
    ...
  }
}
```

---

### 3. Get Review Statistics

**Endpoint:** `GET /trustpilot/stats`

**Authentication:** Required (Bearer Token)

**Query Parameters:**
- `company_domain` (required) - Company domain (e.g., "lemfi.com")

**Example Request:**
```bash
curl --request GET \
  --url 'http://localhost:1000/trustpilot/stats?company_domain=lemfi.com' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

**Example Response:**
```json
{
  "success": true,
  "stats": {
    "totalReviews": 20,
    "averageRating": "4.35",
    "ratingDistribution": {
      "1": 1,
      "2": 0,
      "3": 2,
      "4": 5,
      "5": 12
    },
    "verifiedReviews": 8,
    "unverifiedReviews": 12
  }
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message here"
}
```

### Common Errors:

**400 Bad Request**
```json
{
  "success": false,
  "error": "company_domain is required"
}
```

**401 Unauthorized**
```json
{
  "success": false,
  "error": "Authentication required. Please provide a valid token."
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "error": "An error occurred while fetching reviews"
}
```

---

## Rate Limiting

Trustpilot endpoints are protected by the same rate limiting as other API endpoints:

- **General Rate Limit:** 100 requests per 15 minutes
- **Speed Limiter:** Progressive delays after 50 requests

These are authenticated endpoints, so they also require valid JWT tokens.

---

## Integration Details

### Files Created:

1. **[src/helpers/trustpilotApi.js](src/helpers/trustpilotApi.js)**
   - API client for Trustpilot
   - Functions: `getCompanyReviews()`, `getCompanyInfo()`, `formatReviewData()`

2. **[src/controllers/Trustpilot/trustpilot.controller.js](src/controllers/Trustpilot/trustpilot.controller.js)**
   - Controller functions for handling requests
   - Functions: `getReviews()`, `getCompany()`, `getStats()`

3. **[src/routes/trustpilotRoutes.js](src/routes/trustpilotRoutes.js)**
   - Route definitions for Trustpilot endpoints
   - All routes require authentication

### Security Features:

✅ **Authentication Required** - All endpoints require valid JWT token
✅ **Rate Limiting** - Protected by global rate limiters
✅ **Input Validation** - Validates all query parameters
✅ **Error Handling** - Comprehensive error handling and logging
✅ **Request Timeout** - 10-second timeout for API calls
✅ **XSS Protection** - All inputs sanitized by security middleware
✅ **NoSQL Injection Protection** - Protected by express-mongo-sanitize

---

## Usage Example (Frontend)

```javascript
// Fetch reviews for a company
const fetchReviews = async (companyDomain) => {
  try {
    const token = localStorage.getItem('authToken');

    const response = await fetch(
      `http://localhost:1000/trustpilot/reviews?company_domain=${companyDomain}&page=1`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (data.success) {
      console.log('Reviews:', data.reviews);
      console.log('Total:', data.total);
    } else {
      console.error('Error:', data.error);
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
};

// Usage
fetchReviews('lemfi.com');
```

---

## Testing

You can test the endpoints using curl or Postman.

### Step 1: Login to get JWT token
```bash
curl --request POST \
  --url http://localhost:1000/login \
  --header 'Content-Type: application/json' \
  --data '{
    "email": "your@email.com",
    "password": "yourpassword"
  }'
```

### Step 2: Use the token to fetch reviews
```bash
curl --request GET \
  --url 'http://localhost:1000/trustpilot/reviews?company_domain=lemfi.com' \
  --header 'Authorization: Bearer YOUR_TOKEN_HERE'
```

---

## Notes

- The API uses RapidAPI's Trustpilot endpoint
- API key is already configured in your `.env` file
- All responses are formatted for easy consumption
- Reviews are paginated - use the `page` parameter to fetch more
- The `formatReviewData()` function standardizes the response format

---

## Support

For issues with the Trustpilot API integration, check:
1. API key is valid and not expired
2. JWT token is valid and not expired
3. Company domain exists on Trustpilot
4. Rate limits have not been exceeded

**Last Updated:** 2026-01-04
