const express = require("express");
const app = express();
require("dotenv").config();
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const { isAllowedOrigin, parseAllowedOrigins } = require("./src/helpers/securityUtils");

// Validate environment variables before starting server
const { validateEnvironment } = require("./src/config/validateEnv");
validateEnvironment();

const PORT = process.env.PORT || 1000;
const TRUST_PROXY =
  process.env.TRUST_PROXY ||
  (process.env.NODE_ENV === "production" ? "1" : "false");

// Import routes
const Rateroutes = require("./src/routes/ratesRoutes");
const Authroutes = require("./src/routes/authRoutes");
const Trustpilotroutes = require("./src/routes/trustpilotRoutes");
const Historyroutes = require("./src/routes/historyRoutes");
const Alrtroutes = require("./src/routes/alertRoutes");
const { startAlertCron, stopAlertCron } = require("./src/cron/alertCron");

// Import security middleware
const {
  helmetConfig,
  generalLimiter,
  speedLimiter,
  mongoSanitize,
  hpp,
  xssProtection,
  securityLogger,
  ipTracker
} = require("./src/middleware/securityMiddleware");

// ======================
// SECURITY MIDDLEWARE
// ======================

app.disable("x-powered-by");
app.set(
  "trust proxy",
  TRUST_PROXY === "true" ? true : TRUST_PROXY === "false" ? false : TRUST_PROXY
);

// Helmet - Secure HTTP headers
app.use(helmetConfig);

// IP tracking (must be early in the chain)
app.use(ipTracker);

// Request logging (for monitoring and security auditing)
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined')); // Detailed logs in production
} else {
  app.use(morgan('dev')); // Colored logs in development
}

// CORS configuration
const defaultOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001"
];
const allowedOrigins = parseAllowedOrigins(process.env.ALLOWED_ORIGINS, defaultOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (isAllowedOrigin(origin, allowedOrigins)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
};
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// Body parsing with size limits
app.use(express.json({ limit: '10kb', strict: true })); // Limit JSON body to 10kb
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// Health check endpoint must stay outside the global rate limiters so platform probes don't trip them.
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Rate limiting - Apply general rate limit to all requests
app.use(speedLimiter);
app.use(generalLimiter);

// Data sanitization against NoSQL injection
app.use(mongoSanitize);

// XSS protection
app.use(xssProtection);

// HTTP Parameter Pollution protection
app.use(hpp);

// Security logging
app.use(securityLogger);

// ======================
// DATABASE CONNECTION
// ======================

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✓ MongoDB connected successfully');
  startAlertCron();
})
.catch(err => {
  console.error('✗ MongoDB connection error:', err);
  process.exit(1);
});

// Handle MongoDB errors after initial connection
mongoose.connection.on('error', err => {
  console.error('MongoDB error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

// ======================
// ROUTES
// ======================

app.use("/", Rateroutes);
app.use("/", Authroutes);
app.use("/", Trustpilotroutes);
app.use("/", Historyroutes);
app.use("/", Alrtroutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);

  // CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      error: 'CORS policy violation'
    });
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.message
    });
  }

  // Mongoose cast errors (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});

// ======================
// SERVER START
// ======================

const server = app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ Security middleware active`);
});

async function closeServerGracefully(signal) {
  console.log(`${signal} received, closing server gracefully...`);
  stopAlertCron();

  server.close(async () => {
    console.log('Server closed');

    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    } catch (error) {
      console.error('MongoDB shutdown error:', error);
    } finally {
      process.exit(0);
    }
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  closeServerGracefully('SIGTERM');
});

process.on('SIGINT', () => {
  closeServerGracefully('SIGINT');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;
