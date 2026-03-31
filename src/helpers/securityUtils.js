const crypto = require('crypto');

const DEFAULT_ALLOWED_TRUSTPILOT_DOMAINS = new Set([
  'instarem.com',
  'moneygram.com',
  'mukuru.com',
  'paysend.com',
  'remitly.com',
  'revolut.com',
  'riamoneytransfer.com',
  'sendwave.com',
  'taptapsend.com',
  'westernunion.com',
  'wise.com',
  'worldremit.com',
  'xe.com',
  'xoom.com'
]);

function normalizeOrigin(value) {
  if (!value) return null;

  try {
    const url = new URL(String(value).trim());
    if (!['http:', 'https:'].includes(url.protocol)) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

function parseAllowedOrigins(rawOrigins = '', extraOrigins = []) {
  const items = [
    ...String(rawOrigins || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    ...extraOrigins
  ];

  return [...new Set(items.map(normalizeOrigin).filter(Boolean))];
}

function isAllowedOrigin(origin, allowedOrigins = []) {
  const normalizedOrigin = normalizeOrigin(origin);
  if (!normalizedOrigin) {
    return false;
  }

  return allowedOrigins.includes(normalizedOrigin);
}

function normalizeCompanyDomain(value) {
  if (!value) return null;

  let host = String(value).trim().toLowerCase();

  try {
    if (host.includes('://')) {
      host = new URL(host).hostname.toLowerCase();
    }
  } catch {
    return null;
  }

  host = host.replace(/^www\./, '');

  if (!host || host.includes('..') || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host)) {
    return null;
  }

  return host;
}

function isAllowedTrustpilotDomain(domain) {
  const normalized = normalizeCompanyDomain(domain);
  if (!normalized) {
    return false;
  }

  return DEFAULT_ALLOWED_TRUSTPILOT_DOMAINS.has(normalized);
}

function generateNumericOtp(length = 5) {
  const digits = [];
  for (let index = 0; index < length; index += 1) {
    digits.push(crypto.randomInt(0, 10).toString());
  }

  return digits.join('');
}

function hashOtp(otp) {
  const secret = process.env.JWT_SECRET || 'hulex-otp-fallback-secret';
  return crypto
    .createHash('sha256')
    .update(`${secret}:${String(otp)}`)
    .digest('hex');
}

module.exports = {
  generateNumericOtp,
  hashOtp,
  isAllowedOrigin,
  isAllowedTrustpilotDomain,
  normalizeCompanyDomain,
  normalizeOrigin,
  parseAllowedOrigins
};
