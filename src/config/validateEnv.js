/**
 * Environment Variable Validation
 * Ensures all required environment variables are set before server starts
 */

const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM',
  'FRONTEND_URL'
];

const optionalEnvVars = [
  'PORT',
  'NODE_ENV',
  'JWT_EXPIRY',
  'ALLOWED_ORIGINS',
  'WISE_API_KEY',
  'WISE_API_BASE',
  'REVOLUT_CLIENT_ID',
  'REVOLUT_ENV',
  'REVOLUT_REDIRECT_DOMAIN',
  'ALERT_CRON',
  'ALERT_CRON_TZ'
];

function validateEnvironment() {
  const missing = [];
  const warnings = [];

  // Check required variables
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  if (missing.length > 0) {
    console.error('\n❌ ENVIRONMENT VALIDATION FAILED');
    console.error('The following required environment variables are missing:');
    missing.forEach(varName => {
      console.error(`  - ${varName}`);
    });
    console.error('\nPlease set these variables in your .env file\n');
    process.exit(1);
  }

  // Security checks
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    warnings.push('JWT_SECRET should be at least 32 characters long for security');
  }

  if (process.env.NODE_ENV === 'production') {
    if (!process.env.ALLOWED_ORIGINS) {
      warnings.push('ALLOWED_ORIGINS should be set in production to restrict CORS');
    }

    if (process.env.MONGODB_URI && process.env.MONGODB_URI.includes('localhost')) {
      warnings.push('MONGODB_URI appears to use localhost in production environment');
    }

    if (process.env.FRONTEND_URL && process.env.FRONTEND_URL.includes('localhost')) {
      warnings.push('FRONTEND_URL appears to use localhost in production environment');
    }
  }

  // Display warnings
  if (warnings.length > 0) {
    console.warn('\n⚠️  ENVIRONMENT WARNINGS:');
    warnings.forEach(warning => {
      console.warn(`  - ${warning}`);
    });
    console.warn('');
  }

  // Success message
  console.log('✓ Environment variables validated successfully');

  // Display optional missing variables in development
  if (process.env.NODE_ENV !== 'production') {
    const missingOptional = optionalEnvVars.filter(varName => !process.env[varName]);
    if (missingOptional.length > 0) {
      console.log('\nℹ️  Optional environment variables not set:');
      missingOptional.forEach(varName => {
        console.log(`  - ${varName}`);
      });
      console.log('');
    }
  }
}

module.exports = { validateEnvironment };
