const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

const toInt = (v, d) => {
  const n = parseInt(v || '', 10);
  return Number.isFinite(n) && n > 0 ? n : d;
};

/**
 * Rate limiter for login endpoint
 */
const createLoginLimiter = () => {
  const windowMs = toInt(process.env.LOGIN_RATE_WINDOW_MS, 15 * 60 * 1000);
  const max = toInt(process.env.LOGIN_RATE_MAX, process.env.NODE_ENV === 'development' ? 50 : 5);
  const defaultSkipSuccess = process.env.NODE_ENV === 'test' ? false : true;
  const skipSuccessfulRequests = (process.env.LOGIN_RATE_SKIP_SUCCESS || String(defaultSkipSuccess)).toLowerCase() === 'true';

  return rateLimit({
    windowMs,
    max,
    message: { error: 'For mange innloggingsforsøk. Vennligst prøv igjen senere.' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    keyGenerator: (req, res) => `${ipKeyGenerator(req, res)}:${(req.body?.email || '').toLowerCase()}`,
  });
};

/**
 * Rate limiter for password reset endpoints
 */
const createPasswordResetLimiter = () => {
  const windowMs = toInt(process.env.PWRESET_RATE_WINDOW_MS, 60 * 60 * 1000);
  const max = toInt(process.env.PWRESET_RATE_MAX, 3);

  return rateLimit({
    windowMs,
    max,
    message: { error: 'For mange forsøk på passord tilbakestilling. Vennligst prøv igjen senere.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

/**
 * General API rate limiter
 */
const createGeneralLimiter = () => {
  const windowMs = toInt(process.env.GENERAL_RATE_WINDOW_MS, 15 * 60 * 1000);
  const max = toInt(process.env.GENERAL_RATE_MAX, process.env.NODE_ENV === 'development' ? 2000 : 100);

  return rateLimit({
    windowMs,
    max,
    message: { error: 'For mange requests. Vennligst prøv igjen senere.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS',
    keyGenerator: ipKeyGenerator,
  });
};

/**
 * Rate limiter for expensive mutation operations (POST/PUT/DELETE)
 * Used for bulk operations and resource-intensive endpoints
 */
const createMutationLimiter = () => {
  const windowMs = toInt(process.env.MUTATION_RATE_WINDOW_MS, 15 * 60 * 1000); // 15 minutter
  const max = toInt(process.env.MUTATION_RATE_MAX, process.env.NODE_ENV === 'development' ? 1000 : 20); // Maks 20 mutations per 15 min

  return rateLimit({
    windowMs,
    max,
    message: { error: 'For mange endringer. Vennligst vent litt før du prøver igjen.' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: ipKeyGenerator,
  });
};

module.exports = {
  createLoginLimiter,
  createPasswordResetLimiter,
  createGeneralLimiter,
  createMutationLimiter,
};


