# HulexBE API Documentation

**Base URL:** `http://localhost:1000` (Development)
**Production URL:** `https://your-production-domain.com`

**Version:** 1.0.0
**Last Updated:** 2026-01-04

---

## Table of Contents

1. [Authentication](#authentication)
2. [Rate Comparison APIs](#rate-comparison-apis)
3. [Trustpilot Reviews API](#trustpilot-reviews-api)
4. [Currency & Country Data](#currency--country-data)
5. [History APIs](#history-apis)
6. [Alerts APIs](#alerts-apis)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)
9. [Flutter Integration Guide](#flutter-integration-guide)

---

## Authentication

### 1. Register Account

**Endpoint:** `POST /register`

**Rate Limit:** 5 requests per 15 minutes

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1 555 123 4567",
  "country": "United States",
  "address": "123 Main St, Springfield"
}
```

**Success Response:** `201 Created`
```json
{
  "success": true,
  "message": "Account created successfully. Please check your email for verification code.",
  "userId": "64b6b0a199902cc2c83cf5b0"
}
```

**Error Response:** `400 Bad Request`
```json
{
  "success": false,
  "error": "User with this email already exists"
}
```

---

### 2. Verify Email

**Endpoint:** `POST /verify-email`

**Rate Limit:** 3 requests per hour

**Request Body:**
```json
{
  "otp": "12345"
}
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Email verified successfully. You can now login."
}
```

---

### 3. Login

**Endpoint:** `POST /login`

**Rate Limit:** 5 requests per 15 minutes

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64b6b0a199902cc2c83cf5b0",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "lastLogin": "2026-01-04T10:30:00.000Z"
  }
}
```

**Error Response - Account Locked:** `423 Locked`
```json
{
  "success": false,
  "error": "Account is locked due to multiple failed login attempts. Please try again in 25 minutes."
}
```

**Important:** Save the `token` for authenticated requests!

---

### 4. Get Current User Profile

**Endpoint:** `GET /me`

**Authentication:** Required (Bearer Token)

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "user": {
    "id": "64b6b0a199902cc2c83cf5b0",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "isVerified": true,
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

---

### 5. Request Password Reset

**Endpoint:** `POST /request-password-reset`

**Rate Limit:** 3 requests per hour

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "If an account exists with this email, you will receive a password reset code."
}
```

---

### 6. Reset Password

**Endpoint:** `POST /reset-password`

**Rate Limit:** 5 requests per 15 minutes

**Request Body:**
```json
{
  "otp": "12345",
  "newPassword": "NewSecurePass123"
}
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Password reset successfully. You can now login with your new password."
}
```

---

### 7. Resend Verification Code

**Endpoint:** `POST /resend-verification`

**Rate Limit:** 3 requests per hour

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Verification code sent successfully"
}
```

---

## Rate Comparison APIs

### 1. Compare Exchange Rates (All Providers)

**Endpoint:** `GET /rates/compare`

**Authentication:** Not Required (Public)

**Query Parameters:**
- `fromCurrency` (required) - Source currency code (e.g., "GBP")
- `toCurrency` (required) - Target currency code (e.g., "EUR")
- `amount` (required) - Amount to convert (e.g., 10)
- `providerTypes` (optional) - Filter by provider type: "bank" or "moneyTransferProvider"

**Example Request:**
```
GET /rates/compare?fromCurrency=GBP&toCurrency=EUR&amount=10
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "query": {
    "source": {
      "code": "GBP",
      "name": "British Pound Sterling",
      "symbol": "£",
      "countries": [...]
    },
    "target": {
      "code": "EUR",
      "name": "Euro",
      "symbol": "€",
      "countries": [...]
    },
    "sendAmount": 10
  },
  "stats": {
    "bestRate": {
      "name": "Instarem",
      "rate": 1.1375702247,
      "fee": 0,
      "receivedAmount": 11.38
    },
    "worstRate": {
      "name": "Starling Bank",
      "rate": 1.1392800137,
      "fee": 5.54,
      "receivedAmount": 5.08
    },
    "averageReceivedAmount": 10.1041176470588,
    "averageRate": 1.11405674851176,
    "totalProviders": 17,
    "savingsWithBest": -6.3
  },
  "providers": [
    {
      "id": 107,
      "name": "Instarem",
      "alias": "instarem",
      "type": "moneyTransferProvider",
      "logo": "https://dq8dwmysp7hk1.cloudfront.net/logos/instarem.svg",
      "rate": 1.1375702247,
      "fee": 0,
      "receivedAmount": 11.38,
      "markup": 0.17285706,
      "deliveryTime": {
        "providerGivesEstimate": true,
        "duration": null
      },
      "isMidMarketRate": false,
      "sourceCountry": "GB",
      "targetCountry": "CZ"
    }
  ]
}
```

**Performance:** ⚡ ~2-3 seconds

---

### 2. Get Wise Exchange Rate

**Endpoint:** `GET /rates/wise`

**Authentication:** Not Required (Public)

**Query Parameters:**
- `from` (required) - Source currency code (e.g., "USD")
- `to` (required) - Target currency code (e.g., "EUR")
- `amount` (required) - Amount to convert (e.g., 1)

**Example Request:**
```
GET /rates/wise?from=USD&to=EUR&amount=1
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "from": {
    "code": "USD",
    "name": "US Dollar",
    "symbol": "$",
    "countries": [
      {
        "code": "US",
        "name": "United States",
        "flag": "🇺🇸",
        "flagUrl": "https://flagcdn.com/w320/us.png",
        "flagSvg": "https://flagcdn.com/us.svg",
        "region": "Americas"
      }
    ]
  },
  "to": {
    "code": "EUR",
    "name": "Euro",
    "symbol": "€",
    "countries": [...]
  },
  "amount": 1,
  "rates": {
    "rate": 0.853213,
    "source": "USD",
    "target": "EUR",
    "time": "2026-01-04T09:56:22+0000",
    "amount": "1"
  }
}
```

**Performance:** ⚡ ~500ms - 1 second

---

### 3. Get SendWave Rate

**Endpoint:** `GET /rates/sendwave`

**Authentication:** Not Required (Public)

**Query Parameters:**
- `from` (required) - Source currency code (e.g., "USD")
- `to` (required) - Target currency code (e.g., "NGN")
- `amount` (required) - Amount to send (e.g., 1)
- `fromCountry` (optional) - Source country code (e.g., "US")
- `toCountry` (optional) - Target country code (e.g., "NG")

**Example Request:**
```
GET /rates/sendwave?from=USD&to=NGN&amount=1&fromCountry=US&toCountry=NG
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "from": {
    "code": "USD",
    "name": "US Dollar",
    "symbol": "$",
    "countries": [...]
  },
  "to": {
    "code": "NGN",
    "name": "Nigerian Naira",
    "symbol": "₦",
    "countries": [...]
  },
  "amount": 1,
  "sendCountry": "US",
  "receiveCountry": "NG",
  "rates": {
    "baseExchangeRate": "1467.11112",
    "baseFeeAmount": "0.00",
    "payAmount": "1.00",
    "receiveAmount": "1467",
    "effectiveExchangeRate": "1467.11112",
    "effectiveFeeAmount": "0.00",
    "rateQuote": "Exchange Rate: 1 USD = 1467.11 NGN | Transfer fees: 0.00 USD",
    "dynamicPricing": {
      "bestRateText": "Tap to learn how to get the best rate, up to",
      "bestRateValue": "1.00 USD = 1,469.04 NGN",
      "ratesDescription": {
        "description": "Get a better exchange rate when you send more to loved ones.",
        "title": "Send more to save more",
        "rates": [
          {
            "min": null,
            "max": "$750.00",
            "send": "$1.00",
            "receive": "₦1,467.11"
          }
        ]
      }
    }
  }
}
```

**Performance:** ⚡ ~1-2 seconds

---

### 4. Get Revolut Rate

**Endpoint:** `GET /rates/revolut`

**Authentication:** Not Required (Public)

**Query Parameters:**
- `from` (required) - Source currency code (e.g., "USD")
- `to` (required) - Target currency code (e.g., "EUR")
- `amount` (required) - Amount to convert (e.g., 100)

**Example Request:**
```
GET /rates/revolut?from=USD&to=EUR&amount=100
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "from": {...},
  "to": {...},
  "amount": 100,
  "rates": {
    "rate": 0.85,
    "fee": 0,
    "totalAmount": 85.00
  }
}
```

**Performance:** ⚡ ~1-2 seconds

---

### 5. Get Paysend Rate

**Endpoint:** `GET /rates/paysend`

**Authentication:** Not Required (Public)

**Query Parameters:**
- `from` (required) - Source currency code
- `to` (required) - Target currency code
- `amount` (required) - Amount to send

**Example Request:**
```
GET /rates/paysend?from=GBP&to=USD&amount=100
```

**Performance:** ⚡ ~1-2 seconds

---

### 6. Get Specific Provider Rate

**Endpoint:** `GET /rates/provider`

**Authentication:** Not Required (Public)

**Query Parameters:**
- `fromCurrency` (required) - Source currency code
- `toCurrency` (required) - Target currency code
- `amount` (required) - Amount to convert
- `provider` (required) - Provider name (e.g., "wise", "revolut", "sendwave")

**Example Request:**
```
GET /rates/provider?fromCurrency=USD&toCurrency=EUR&amount=100&provider=wise
```

**Performance:** ⚡ ~500ms - 1 second

---

## Trustpilot Reviews API

### 1. Get Company Reviews

**Endpoint:** `GET /trustpilot/reviews`

**Authentication:** Required (Bearer Token)

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters:**
- `company_domain` (required) - Company domain (e.g., "sendwave.com")
- `locale` (optional) - Locale code (default: "en-US")
- `date_posted` (optional) - Filter: "any", "last_week", "last_month", "last_year" (default: "any")
- `page` (optional) - Page number (default: 1)

**Example Request:**
```
GET /trustpilot/reviews?company_domain=sendwave.com&page=1&date_posted=any
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "reviews": [
    {
      "id": "64b6b0a199902cc2c83cf5b0",
      "title": "Great service!",
      "text": "I had a wonderful experience with this company...",
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
        "image": "https://user-images.trustpilot.com/...",
        "reviewCount": 1,
        "country": "US",
        "isVerified": false
      }
    }
  ],
  "total": 20,
  "page": 1,
  "requestId": "8ba84925-1353-4826-937b-e5378127ea99"
}
```

**Performance:** ⚡ ~2-3 seconds

---

### 2. Get Company Information

**Endpoint:** `GET /trustpilot/company`

**Authentication:** Required (Bearer Token)

**Query Parameters:**
- `company_domain` (required) - Company domain (e.g., "sendwave.com")

**Example Request:**
```
GET /trustpilot/company?company_domain=sendwave.com
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "company_name": "Lemfi",
    "company_domain": "sendwave.com",
    "trust_score": 4.5,
    "total_reviews": 1234
  }
}
```

**Performance:** ⚡ ~1-2 seconds

---

### 3. Get Review Statistics

**Endpoint:** `GET /trustpilot/stats`

**Authentication:** Required (Bearer Token)

**Query Parameters:**
- `company_domain` (required) - Company domain

**Example Request:**
```
GET /trustpilot/stats?company_domain=sendwave.com
```

**Success Response:** `200 OK`
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

**Performance:** ⚡ ~2-3 seconds

---

## Currency & Country Data

### 1. Get All Currencies

**Endpoint:** `GET /currencies`

**Authentication:** Not Required (Public)

**Success Response:** `200 OK`
```json
{
  "success": true,
  "currencies": [
    {
      "code": "USD",
      "name": "US Dollar",
      "symbol": "$",
      "countries": ["US", "EC"]
    },
    {
      "code": "EUR",
      "name": "Euro",
      "symbol": "€",
      "countries": ["DE", "FR", "IT", ...]
    }
  ]
}
```

**Performance:** ⚡ Instant (< 100ms)

---

### 2. Get All Countries

**Endpoint:** `GET /countries`

**Authentication:** Not Required (Public)

**Query Parameters:**
- `region` (optional) - Filter by region: "Africa", "Americas", "Asia", "Europe", "Oceania"

**Example Request:**
```
GET /countries?region=Africa
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "countries": [
    {
      "code": "NG",
      "name": "Nigeria",
      "currency": "NGN",
      "currencyName": "Nigerian Naira",
      "currencySymbol": "₦",
      "flag": "🇳🇬",
      "flagUrl": "https://flagcdn.com/w320/ng.png",
      "flagSvg": "https://flagcdn.com/ng.svg",
      "region": "Africa"
    }
  ]
}
```

**Performance:** ⚡ Instant (< 100ms)

---

### 3. Get Countries by Currency

**Endpoint:** `GET /currencies/:currency/countries`

**Authentication:** Not Required (Public)

**Example Request:**
```
GET /currencies/EUR/countries
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "currency": {
    "code": "EUR",
    "name": "Euro",
    "symbol": "€"
  },
  "countries": [
    {
      "code": "DE",
      "name": "Germany",
      "flag": "🇩🇪",
      "flagUrl": "https://flagcdn.com/w320/de.png",
      "region": "Europe"
    }
  ]
}
```

**Performance:** ⚡ Instant (< 100ms)

---

## History APIs

> History is automatically recorded when an authenticated user calls `GET /rates/compare`.

### 1. Get Rate History

**Endpoint:** `GET /history`

**Authentication:** Required

**Query Parameters:**
- `page` (optional, default `1`)
- `limit` (optional, default `20`, max `100`)
- `fromCurrency` (optional)
- `toCurrency` (optional)

**Success Response:** `200 OK`
```json
{
  "success": true,
  "page": 1,
  "limit": 20,
  "total": 3,
  "items": [
    {
      "_id": "65b123...",
      "fromCurrency": "USD",
      "toCurrency": "NGN",
      "amount": 1,
      "stats": {
        "bestRate": {},
        "worstRate": {},
        "averageReceivedAmount": 1548.12,
        "averageRate": 1548.12,
        "totalProviders": 5,
        "savingsWithBest": 120.5
      },
      "providers": [],
      "checkedAt": "2026-01-28T12:00:00.000Z"
    }
  ]
}
```

---

### 2. Get History Item

**Endpoint:** `GET /history/:id`

**Authentication:** Required

**Success Response:** `200 OK`
```json
{
  "success": true,
  "item": {
    "_id": "65b123...",
    "fromCurrency": "USD",
    "toCurrency": "NGN",
    "amount": 1,
    "checkedAt": "2026-01-28T12:00:00.000Z"
  }
}
```

---

### 3. Delete History Item

**Endpoint:** `DELETE /history/:id`

**Authentication:** Required

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "History item deleted"
}
```

---

### 4. Clear History

**Endpoint:** `DELETE /history`

**Authentication:** Required

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "History cleared"
}
```

---

## Alerts APIs

> Alerts are checked by a cron job (default: `0 9,13,20 * * *` in `UTC`).  
> Configure with `ALERT_CRON` and `ALERT_CRON_TZ`.
> Hourly backend push digest is enabled by default (`0 * * * *`) and can be configured via:
> `HOURLY_RATES_CRON`, `HOURLY_RATES_CRON_TZ`, `HOURLY_RATE_PAIRS`, `HOURLY_RATE_AMOUNT`.

### 1. Create Alert

**Endpoint:** `POST /alerts`

**Authentication:** Required

**Request Body:**
```json
{
  "fromCurrency": "USD",
  "toCurrency": "NGN",
  "amount": 1,
  "targetAmount": 2000,
  "condition": "gte",
  "providerType": "remittance"
}
```

**Success Response:** `201 Created`
```json
{
  "success": true,
  "alert": {
    "_id": "65b456...",
    "fromCurrency": "USD",
    "toCurrency": "NGN",
    "amount": 1,
    "targetAmount": 2000,
    "condition": "gte",
    "providerType": "remittance",
    "active": true
  }
}
```

---

### 2. List Alerts

**Endpoint:** `GET /alerts`

**Authentication:** Required

**Query Parameters:**
- `page` (optional)
- `limit` (optional)
- `active` (optional, `true|false`)

---

### 3. Get Alert

**Endpoint:** `GET /alerts/:id`

**Authentication:** Required

---

### 4. Update Alert

**Endpoint:** `PATCH /alerts/:id`

**Authentication:** Required

**Request Body (any):**
```json
{
  "targetAmount": 1500,
  "condition": "gte",
  "active": true
}
```

---

### 5. Delete Alert

**Endpoint:** `DELETE /alerts/:id`

**Authentication:** Required

---

### 6. Run Alert Check (Manual)

**Endpoint:** `POST /alerts/run-check`

**Authentication:** Required

**Success Response:** `200 OK`
```json
{
  "success": true,
  "results": [
    {
      "alertId": "65b456...",
      "triggered": true,
      "notificationId": "65b789..."
    }
  ]
}
```

---

### 7. List Alert Notifications

**Endpoint:** `GET /alerts/notifications`

**Authentication:** Required

---

### 8. Register Push Token

**Endpoint:** `POST /alerts/device-token`

**Authentication:** Required

**Request Body:**
```json
{
  "token": "DEVICE_PUSH_TOKEN",
  "platform": "ios"
}
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Push token registered"
}
```

### 9. Firebase Push Setup (Backend)

To actually deliver push notifications (not just store device tokens), configure Firebase Admin credentials on the backend.

Use one of the following approaches:

- `FIREBASE_SERVICE_ACCOUNT_JSON` as a full JSON string for the service account
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- `GOOGLE_APPLICATION_CREDENTIALS` path to a service account JSON file

Example `.env` values:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Notes:

- Device tokens are saved via `POST /alerts/device-token`.
- Alert-triggered pushes are sent by the alerts service.
- Hourly rate digest pushes are sent to all users with registered tokens.
- Invalid FCM tokens are automatically removed from user records.

---

## Error Handling

All endpoints return consistent error responses:

### Error Response Format:
```json
{
  "success": false,
  "error": "Error message here"
}
```

### Common HTTP Status Codes:

| Code | Meaning | Description |
|------|---------|-------------|
| `200` | OK | Request successful |
| `201` | Created | Resource created successfully |
| `400` | Bad Request | Invalid request parameters |
| `401` | Unauthorized | Authentication required or invalid token |
| `403` | Forbidden | Access denied (e.g., CORS violation) |
| `404` | Not Found | Resource not found |
| `423` | Locked | Account locked (too many failed attempts) |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Server error |

### Example Error Responses:

**Invalid Parameters:**
```json
{
  "success": false,
  "error": "company_domain is required"
}
```

**Authentication Error:**
```json
{
  "success": false,
  "error": "Token has expired. Please login again.",
  "code": "TOKEN_EXPIRED"
}
```

**Rate Limit Exceeded:**
```json
{
  "success": false,
  "error": "Too many requests from this IP, please try again later."
}
```

**Account Locked:**
```json
{
  "success": false,
  "error": "Account is locked due to multiple failed login attempts. Please try again in 25 minutes."
}
```

---

## Rate Limiting

The API implements multiple layers of rate limiting:

### General API Endpoints
- **Limit:** 100 requests per 15 minutes per IP
- **Applies to:** All endpoints

### Authentication Endpoints
- **Limit:** 5 requests per 15 minutes per IP
- **Applies to:** `/login`, `/register`, `/reset-password`

### OTP Endpoints
- **Limit:** 3 requests per hour per IP
- **Applies to:** `/verify-email`, `/request-password-reset`, `/resend-verification`

### Speed Limiting
- After 50 requests in 15 minutes, progressive delays are added
- 500ms delay per request
- Maximum delay: 20 seconds

**When rate limited:**
```json
{
  "success": false,
  "error": "Too many authentication attempts, please try again after 15 minutes."
}
```

---

## Flutter Integration Guide

### 1. Setup HTTP Client

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class ApiService {
  static const String baseUrl = 'http://localhost:1000'; // Change in production

  String? _authToken;

  // Store token after login
  void setAuthToken(String token) {
    _authToken = token;
  }

  // Get headers with or without auth
  Map<String, String> _getHeaders({bool needsAuth = false}) {
    final headers = {
      'Content-Type': 'application/json',
    };

    if (needsAuth && _authToken != null) {
      headers['Authorization'] = 'Bearer $_authToken';
    }

    return headers;
  }
}
```

---

### 2. Authentication Methods

```dart
// Register
Future<Map<String, dynamic>> register({
  required String email,
  required String password,
  required String firstName,
  required String lastName,
}) async {
  final response = await http.post(
    Uri.parse('$baseUrl/register'),
    headers: _getHeaders(),
    body: jsonEncode({
      'email': email,
      'password': password,
      'firstName': firstName,
      'lastName': lastName,
    }),
  );

  return jsonDecode(response.body);
}

// Login
Future<Map<String, dynamic>> login({
  required String email,
  required String password,
}) async {
  final response = await http.post(
    Uri.parse('$baseUrl/login'),
    headers: _getHeaders(),
    body: jsonEncode({
      'email': email,
      'password': password,
    }),
  );

  final data = jsonDecode(response.body);

  if (data['success'] && data['token'] != null) {
    setAuthToken(data['token']);
  }

  return data;
}

// Verify Email
Future<Map<String, dynamic>> verifyEmail(String otp) async {
  final response = await http.post(
    Uri.parse('$baseUrl/verify-email'),
    headers: _getHeaders(),
    body: jsonEncode({'otp': otp}),
  );

  return jsonDecode(response.body);
}
```

---

### 3. Rate Comparison Methods

```dart
// Compare all providers
Future<Map<String, dynamic>> compareRates({
  required String fromCurrency,
  required String toCurrency,
  required double amount,
  String? providerType,
}) async {
  final queryParams = {
    'fromCurrency': fromCurrency,
    'toCurrency': toCurrency,
    'amount': amount.toString(),
    if (providerType != null) 'providerTypes': providerType,
  };

  final uri = Uri.parse('$baseUrl/rates/compare')
      .replace(queryParameters: queryParams);

  final response = await http.get(uri, headers: _getHeaders());

  return jsonDecode(response.body);
}

// Get Wise rate
Future<Map<String, dynamic>> getWiseRate({
  required String from,
  required String to,
  required double amount,
}) async {
  final uri = Uri.parse('$baseUrl/rates/wise').replace(
    queryParameters: {
      'from': from,
      'to': to,
      'amount': amount.toString(),
    },
  );

  final response = await http.get(uri, headers: _getHeaders());

  return jsonDecode(response.body);
}

// Get SendWave rate
Future<Map<String, dynamic>> getSendWaveRate({
  required String from,
  required String to,
  required double amount,
  String? fromCountry,
  String? toCountry,
}) async {
  final queryParams = {
    'from': from,
    'to': to,
    'amount': amount.toString(),
    if (fromCountry != null) 'fromCountry': fromCountry,
    if (toCountry != null) 'toCountry': toCountry,
  };

  final uri = Uri.parse('$baseUrl/rates/sendwave')
      .replace(queryParameters: queryParams);

  final response = await http.get(uri, headers: _getHeaders());

  return jsonDecode(response.body);
}
```

---

### 4. Trustpilot Reviews Methods

```dart
// Get company reviews
Future<Map<String, dynamic>> getCompanyReviews({
  required String companyDomain,
  String locale = 'en-US',
  String datePosted = 'any',
  int page = 1,
}) async {
  final uri = Uri.parse('$baseUrl/trustpilot/reviews').replace(
    queryParameters: {
      'company_domain': companyDomain,
      'locale': locale,
      'date_posted': datePosted,
      'page': page.toString(),
    },
  );

  final response = await http.get(
    uri,
    headers: _getHeaders(needsAuth: true),
  );

  return jsonDecode(response.body);
}

// Get review statistics
Future<Map<String, dynamic>> getReviewStats({
  required String companyDomain,
}) async {
  final uri = Uri.parse('$baseUrl/trustpilot/stats').replace(
    queryParameters: {'company_domain': companyDomain},
  );

  final response = await http.get(
    uri,
    headers: _getHeaders(needsAuth: true),
  );

  return jsonDecode(response.body);
}
```

---

### 5. Currency & Country Data Methods

```dart
// Get all currencies
Future<List<dynamic>> getAllCurrencies() async {
  final response = await http.get(
    Uri.parse('$baseUrl/currencies'),
    headers: _getHeaders(),
  );

  final data = jsonDecode(response.body);
  return data['currencies'];
}

// Get countries by region
Future<List<dynamic>> getCountries({String? region}) async {
  final uri = Uri.parse('$baseUrl/countries').replace(
    queryParameters: region != null ? {'region': region} : null,
  );

  final response = await http.get(uri, headers: _getHeaders());

  final data = jsonDecode(response.body);
  return data['countries'];
}

// Get countries by currency
Future<List<dynamic>> getCountriesByCurrency(String currencyCode) async {
  final response = await http.get(
    Uri.parse('$baseUrl/currencies/$currencyCode/countries'),
    headers: _getHeaders(),
  );

  final data = jsonDecode(response.body);
  return data['countries'];
}
```

---

### 6. Error Handling in Flutter

```dart
Future<Map<String, dynamic>> _handleRequest(
  Future<http.Response> Function() request,
) async {
  try {
    final response = await request();
    final data = jsonDecode(response.body);

    // Handle different status codes
    if (response.statusCode == 200 || response.statusCode == 201) {
      return data;
    } else if (response.statusCode == 401) {
      // Token expired - redirect to login
      throw Exception('Session expired. Please login again.');
    } else if (response.statusCode == 423) {
      // Account locked
      throw Exception(data['error'] ?? 'Account locked');
    } else if (response.statusCode == 429) {
      // Rate limited
      throw Exception('Too many requests. Please try again later.');
    } else {
      throw Exception(data['error'] ?? 'An error occurred');
    }
  } catch (e) {
    rethrow;
  }
}
```

---

### 7. Complete Usage Example

```dart
void main() async {
  final api = ApiService();

  // 1. Register
  final registerResult = await api.register(
    email: 'user@example.com',
    password: 'SecurePass123',
    firstName: 'John',
    lastName: 'Doe',
  );
  print('Register: $registerResult');

  // 2. Verify email with OTP
  final verifyResult = await api.verifyEmail('12345');
  print('Verify: $verifyResult');

  // 3. Login
  final loginResult = await api.login(
    email: 'user@example.com',
    password: 'SecurePass123',
  );
  print('Login: $loginResult');

  // 4. Compare exchange rates
  final ratesResult = await api.compareRates(
    fromCurrency: 'GBP',
    toCurrency: 'EUR',
    amount: 100,
  );
  print('Best rate: ${ratesResult['stats']['bestRate']}');

  // 5. Get Wise rate
  final wiseRate = await api.getWiseRate(
    from: 'USD',
    to: 'EUR',
    amount: 1,
  );
  print('Wise rate: ${wiseRate['rates']['rate']}');

  // 6. Get Trustpilot reviews
  final reviews = await api.getCompanyReviews(
    companyDomain: 'sendwave.com',
    page: 1,
  );
  print('Reviews: ${reviews['total']} reviews found');

  // 7. Get currencies
  final currencies = await api.getAllCurrencies();
  print('Currencies: ${currencies.length} available');
}
```

---

### 8. State Management (Provider Example)

```dart
import 'package:flutter/foundation.dart';

class ApiProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  bool _isLoading = false;
  String? _error;
  Map<String, dynamic>? _currentUser;

  bool get isLoading => _isLoading;
  String? get error => _error;
  Map<String, dynamic>? get currentUser => _currentUser;
  bool get isAuthenticated => _currentUser != null;

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _apiService.login(
        email: email,
        password: password,
      );

      if (result['success']) {
        _currentUser = result['user'];
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = result['error'];
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  void logout() {
    _currentUser = null;
    _apiService.setAuthToken('');
    notifyListeners();
  }
}
```

---

## Performance Optimization Tips

### 1. Caching Strategy
```dart
// Cache currencies and countries data (rarely changes)
class DataCache {
  static List<dynamic>? _currencies;
  static List<dynamic>? _countries;
  static DateTime? _lastUpdate;

  static bool shouldRefresh() {
    if (_lastUpdate == null) return true;
    return DateTime.now().difference(_lastUpdate!) > Duration(hours: 24);
  }

  static Future<List<dynamic>> getCurrencies(ApiService api) async {
    if (_currencies == null || shouldRefresh()) {
      _currencies = await api.getAllCurrencies();
      _lastUpdate = DateTime.now();
    }
    return _currencies!;
  }
}
```

### 2. Parallel Requests
```dart
// Fetch multiple rates in parallel
Future<void> fetchAllRates() async {
  final results = await Future.wait([
    api.getWiseRate(from: 'USD', to: 'EUR', amount: 100),
    api.getSendWaveRate(from: 'USD', to: 'NGN', amount: 100),
    api.compareRates(fromCurrency: 'GBP', toCurrency: 'EUR', amount: 100),
  ]);

  final wiseRate = results[0];
  final sendWaveRate = results[1];
  final comparison = results[2];
}
```

### 3. Debouncing API Calls
```dart
import 'dart:async';

class Debouncer {
  final int milliseconds;
  Timer? _timer;

  Debouncer({required this.milliseconds});

  void run(VoidCallback action) {
    _timer?.cancel();
    _timer = Timer(Duration(milliseconds: milliseconds), action);
  }
}

// Usage for search
final debouncer = Debouncer(milliseconds: 500);

onSearchChanged(String query) {
  debouncer.run(() {
    // API call here
    api.compareRates(...);
  });
}
```

---

## Security Best Practices

### 1. Store JWT Token Securely
```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorage {
  final storage = FlutterSecureStorage();

  Future<void> saveToken(String token) async {
    await storage.write(key: 'auth_token', value: token);
  }

  Future<String?> getToken() async {
    return await storage.read(key: 'auth_token');
  }

  Future<void> deleteToken() async {
    await storage.delete(key: 'auth_token');
  }
}
```

### 2. Handle Token Expiration
```dart
Future<http.Response> _authenticatedRequest(
  Future<http.Response> Function() request,
) async {
  final response = await request();

  if (response.statusCode == 401) {
    final data = jsonDecode(response.body);
    if (data['code'] == 'TOKEN_EXPIRED') {
      // Redirect to login
      navigatorKey.currentState?.pushReplacementNamed('/login');
    }
  }

  return response;
}
```

---

## Testing Endpoints

Use this Postman collection or test with curl:

```bash
# Login
curl -X POST http://localhost:1000/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Compare rates
curl -X GET 'http://localhost:1000/rates/compare?fromCurrency=GBP&toCurrency=EUR&amount=100'

# Get reviews (with auth)
curl -X GET 'http://localhost:1000/trustpilot/reviews?company_domain=sendwave.com' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

---

## Support & Contact

For API issues or questions:
- **Email:** api-support@hulex.com
- **Documentation:** https://docs.hulex.com
- **Status:** https://status.hulex.com

---

**Last Updated:** 2026-01-04
**API Version:** 1.0.0
