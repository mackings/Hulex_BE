# Security Documentation - HulexBE

This document outlines the security measures implemented in the HulexBE application to protect against common attacks and vulnerabilities.

## Table of Contents
1. [Security Features Overview](#security-features-overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Rate Limiting & DDoS Protection](#rate-limiting--ddos-protection)
4. [Input Validation & Sanitization](#input-validation--sanitization)
5. [Security Headers](#security-headers)
6. [Database Security](#database-security)
7. [API Security](#api-security)
8. [Logging & Monitoring](#logging--monitoring)
9. [Environment Variables](#environment-variables)
10. [Deployment Security Checklist](#deployment-security-checklist)
11. [Security Best Practices](#security-best-practices)

---

## Security Features Overview

HulexBE implements multiple layers of security protection:

✅ **Helmet.js** - Secure HTTP headers
✅ **Rate Limiting** - Prevents brute force and DDoS attacks
✅ **Account Lockout** - Locks accounts after failed login attempts
✅ **JWT Authentication** - Secure token-based authentication
✅ **Input Sanitization** - XSS and NoSQL injection protection
✅ **CORS Protection** - Configurable origin restrictions
✅ **Request Size Limits** - Prevents payload attacks
✅ **Security Logging** - Monitors suspicious activities
✅ **Environment Validation** - Ensures proper configuration

---

## Authentication & Authorization

### Password Security
- **Bcrypt hashing** with 10 salt rounds
- Minimum 8 characters with complexity requirements
- Passwords never exposed in API responses

### JWT Tokens
- **Algorithm**: HS256 (explicitly enforced)
- **Expiry**: 7 days (configurable via `JWT_EXPIRY`)
- **Issuer/Audience validation**: `hulex-api` / `hulex-client`
- Token includes: `userId`, `email`, `iat` (issued at time)
- Tokens are validated on every protected route

### Account Lockout
- **Max Failed Attempts**: 5 login attempts
- **Lockout Duration**: 30 minutes
- **Auto-unlock**: Account unlocks automatically after lockout period
- **IP Tracking**: Logs IP addresses for security monitoring
- Failed attempts are tracked per user account

### OTP Security
- **OTP Length**: 5 digits (numeric)
- **Expiration**: 10 minutes
- **Rate Limited**: 3 OTP requests per hour per IP
- Separate OTPs for email verification and password reset
- OTPs are cleared after successful verification

---

## Rate Limiting & DDoS Protection

### General API Rate Limiting
```javascript
Window: 15 minutes
Max Requests: 100 per IP
```

### Authentication Endpoint Rate Limiting
```javascript
Window: 15 minutes
Max Requests: 5 per IP
Endpoints: /login, /register, /reset-password
```

### OTP Endpoint Rate Limiting
```javascript
Window: 1 hour
Max Requests: 3 per IP
Endpoints: /verify-email, /request-password-reset, /resend-verification
```

### Speed Limiting
- Adds progressive delays after 50 requests in 15 minutes
- 500ms delay per request
- Maximum delay: 20 seconds

### Request Size Limits
- JSON body: **10KB maximum**
- URL-encoded body: **10KB maximum**

---

## Input Validation & Sanitization

### Express Validator
All authentication endpoints use validation middleware:
- Email format validation
- Password strength requirements
- Required field validation
- Trim whitespace from inputs

### MongoDB Injection Protection
- **express-mongo-sanitize** removes `$` and `.` characters
- Replaces dangerous characters with `_`
- Logs potential injection attempts

### XSS Protection
Custom middleware removes dangerous patterns:
- `<script>` tags
- `javascript:` protocol
- Event handlers (`onclick`, `onerror`, etc.)
- `<iframe>`, `<object>`, `<embed>` tags

### HTTP Parameter Pollution (HPP)
Prevents duplicate parameters in requests, except whitelisted ones:
- `fromCurrency`, `toCurrency`, `amount`, `provider`, `region`

---

## Security Headers

Implemented via **Helmet.js**:

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Security-Policy` | Strict policy | Prevents XSS attacks |
| `Strict-Transport-Security` | 1 year, includeSubDomains | Forces HTTPS |
| `X-Content-Type-Options` | nosniff | Prevents MIME sniffing |
| `X-Frame-Options` | DENY | Prevents clickjacking |
| `X-XSS-Protection` | 1; mode=block | Enables browser XSS filter |
| `Referrer-Policy` | strict-origin-when-cross-origin | Controls referrer info |

---

## Database Security

### MongoDB Connection
- Uses connection string with authentication
- Automatic reconnection on disconnect
- Error event handlers for monitoring

### User Data Protection
- Passwords never returned in queries (`.select('-password')`)
- OTP codes excluded from user responses
- Indexes on email for fast lookup

### Schema Validation
- Required fields enforced at schema level
- Email uniqueness constraint
- Data type validation

---

## API Security

### CORS Configuration
```javascript
Allowed Origins: Configurable via ALLOWED_ORIGINS env var
Credentials: true
Methods: GET, POST, PUT, DELETE, PATCH
Headers: Content-Type, Authorization
Max Age: 24 hours
```

### Protected Routes
All protected routes require:
1. Valid JWT token in `Authorization: Bearer <token>` header
2. User account exists and is verified
3. Account is not locked
4. Token has not expired

### IP Change Detection
- Tracks last login IP address
- Logs warnings when IP changes between requests
- Helps detect account compromise

---

## Logging & Monitoring

### Security Events Logged

**Login Success**
```json
{
  "timestamp": "ISO-8601",
  "type": "LOGIN_SUCCESS",
  "email": "user@example.com",
  "ip": "1.2.3.4"
}
```

**Account Lockout**
```json
{
  "timestamp": "ISO-8601",
  "type": "ACCOUNT_LOCKED",
  "email": "user@example.com",
  "ip": "1.2.3.4",
  "attempts": 5
}
```

**IP Change Detection**
```json
{
  "timestamp": "ISO-8601",
  "type": "IP_CHANGE_DETECTED",
  "userId": "...",
  "email": "user@example.com",
  "previousIp": "1.2.3.4",
  "currentIp": "5.6.7.8"
}
```

**Suspicious Requests**
```json
{
  "timestamp": "ISO-8601",
  "type": "SUSPICIOUS_REQUEST",
  "ip": "1.2.3.4",
  "method": "POST",
  "url": "/api/endpoint",
  "userAgent": "...",
  "body": {...}
}
```

### Request Logging
- **Development**: Colored logs with `morgan('dev')`
- **Production**: Detailed logs with `morgan('combined')`

---

## Environment Variables

### Required Variables
```bash
MONGODB_URI          # MongoDB connection string
JWT_SECRET           # JWT signing secret (min 32 chars)
SMTP_HOST            # Email server host
SMTP_PORT            # Email server port
SMTP_USER            # Email account username
SMTP_PASS            # Email account password
SMTP_FROM            # Sender name
FRONTEND_URL         # Frontend application URL
```

### Optional Variables
```bash
PORT                 # Server port (default: 1000)
NODE_ENV             # Environment (development/production)
JWT_EXPIRY           # Token expiry (default: 7d)
ALLOWED_ORIGINS      # CORS allowed origins (comma-separated)
```

### Security Validation
The server validates environment variables on startup:
- Checks all required variables are set
- Warns if JWT_SECRET is less than 32 characters
- Warns about localhost usage in production
- Exits if critical variables are missing

---

## Deployment Security Checklist

### Before Deploying to Production

- [ ] **Generate a strong JWT_SECRET**
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```

- [ ] **Set NODE_ENV to production**
  ```bash
  NODE_ENV=production
  ```

- [ ] **Configure ALLOWED_ORIGINS**
  ```bash
  ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
  ```

- [ ] **Use production database**
  - Don't use localhost MongoDB
  - Use connection string with authentication
  - Enable IP whitelisting on MongoDB Atlas

- [ ] **Update FRONTEND_URL**
  ```bash
  FRONTEND_URL=https://yourdomain.com
  ```

- [ ] **Use HTTPS**
  - Deploy behind HTTPS reverse proxy (Nginx, Cloudflare, etc.)
  - Helmet enforces HTTPS via HSTS headers

- [ ] **Use production SMTP credentials**
  - Use dedicated email service (SendGrid, AWS SES, etc.)
  - Don't use personal Gmail account

- [ ] **Rotate API keys**
  - Update WISE_API_KEY and REVOLUT_CLIENT_ID
  - Use production API credentials

- [ ] **Set up monitoring**
  - Monitor server logs
  - Set up alerts for suspicious activity
  - Track failed login attempts

- [ ] **Review certificate files**
  - Ensure Revolut certificates are production-ready
  - Keep private keys secure

- [ ] **Enable firewall**
  - Restrict database access to server IPs only
  - Close unnecessary ports

---

## Security Best Practices

### For Developers

1. **Never commit secrets**
   - Keep `.env` in `.gitignore`
   - Use `.env.example` for documentation
   - Rotate keys if accidentally committed

2. **Keep dependencies updated**
   ```bash
   npm audit
   npm audit fix
   npm outdated
   ```

3. **Review code for vulnerabilities**
   - Avoid `eval()` and `Function()` constructors
   - Sanitize all user inputs
   - Use parameterized queries

4. **Test authentication flows**
   - Test account lockout mechanism
   - Verify rate limiting works
   - Test token expiration

5. **Monitor logs regularly**
   - Check for suspicious patterns
   - Track failed authentication attempts
   - Monitor IP changes

### For Users

1. **Use strong passwords**
   - Minimum 8 characters
   - Mix of uppercase, lowercase, and numbers
   - Avoid common passwords

2. **Verify email immediately**
   - Account must be verified to login
   - OTP codes expire in 10 minutes

3. **Don't share JWT tokens**
   - Tokens provide full access to account
   - Keep tokens secure in frontend storage

4. **Report suspicious activity**
   - Contact support if you see unusual login locations
   - Reset password if account is compromised

---

## Common Attack Mitigations

### ✅ Brute Force Attacks
- **Protected by**: Rate limiting + Account lockout
- After 5 failed attempts, account is locked for 30 minutes

### ✅ DDoS Attacks
- **Protected by**: General rate limiting + Speed limiting
- 100 requests per 15 minutes per IP

### ✅ SQL/NoSQL Injection
- **Protected by**: express-mongo-sanitize + Mongoose validation
- All `$` and `.` characters are removed from inputs

### ✅ XSS (Cross-Site Scripting)
- **Protected by**: Custom XSS middleware + Helmet CSP
- Dangerous HTML tags and JavaScript are stripped

### ✅ CSRF (Cross-Site Request Forgery)
- **Protected by**: CORS restrictions + JWT authentication
- Only allowed origins can make requests

### ✅ Clickjacking
- **Protected by**: X-Frame-Options header
- Application cannot be embedded in iframes

### ✅ Man-in-the-Middle
- **Protected by**: HSTS header (when using HTTPS)
- Forces secure connections

### ✅ Account Enumeration
- **Protected by**: Generic error messages
- Login/password reset don't reveal if account exists

### ✅ Session Hijacking
- **Protected by**: Short-lived JWTs + IP tracking
- Tokens expire after 7 days

---

## Reporting Security Issues

If you discover a security vulnerability, please email: **security@hulex.com**

Do not create public GitHub issues for security vulnerabilities.

---

## License & Disclaimer

This security implementation provides defense-in-depth but cannot guarantee 100% security. Regular security audits, monitoring, and updates are essential for maintaining a secure application.

**Last Updated**: 2026-01-04
