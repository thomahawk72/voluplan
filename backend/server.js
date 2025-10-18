const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('./shared/config/passport');
const path = require('path');
const helmet = require('helmet');
const { createGeneralLimiter } = require('./shared/middleware/rateLimiter');
const { validateEnv } = require('./shared/utils/envValidator');
require('dotenv').config();

// Validate environment variables on startup
validateEnv();

const app = express();

// Trust proxy for Heroku
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security headers with Helmet.js
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Material-UI requires inline styles
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:3000'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  crossOriginEmbedderPolicy: false, // Avoid breaking OAuth
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow resources from other origins
}));

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// Apply general rate limiting to all API routes
app.use('/api/', createGeneralLimiter());

// Module Routes
app.use('/api', require('./modules/bruker/routes'));
app.use('/api/talent', require('./modules/talent/routes'));
app.use('/api/produksjon', require('./modules/produksjon/routes'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Fallback handler - serve React app for non-API routes
app.use((req, res) => {
  if (process.env.NODE_ENV === 'production' && !req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  } else {
    res.status(404).json({ error: 'Route not found' });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;

