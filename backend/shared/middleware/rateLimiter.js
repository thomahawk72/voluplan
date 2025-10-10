const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for login endpoint
 * Prevents brute-force attacks on login
 */
const createLoginLimiter = () => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutter
    max: 5, // Maks 5 forsøk per 15 minutter
    message: {
      error: 'For mange innloggingsforsøk. Vennligst prøv igjen om 15 minutter.',
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests: false, // Teller alle requests, ikke bare feilede
  });
};

/**
 * Rate limiter for password reset endpoints
 * Prevents abuse of password reset functionality
 */
const createPasswordResetLimiter = () => {
  return rateLimit({
    windowMs: 60 * 60 * 1000, // 1 time
    max: 3, // Maks 3 forsøk per time
    message: {
      error: 'For mange forsøk på passord tilbakestilling. Vennligst prøv igjen senere.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

/**
 * General API rate limiter
 * Applies to all API endpoints to prevent abuse
 */
const createGeneralLimiter = () => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutter
    max: 100, // Maks 100 requests per 15 minutter
    message: {
      error: 'For mange requests. Vennligst prøv igjen senere.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

module.exports = {
  createLoginLimiter,
  createPasswordResetLimiter,
  createGeneralLimiter,
};


