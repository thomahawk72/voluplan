/**
 * Bruker Routes
 * Definerer alle API-endepunkter for brukermodulen
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const controller = require('./controller');
const { authenticateToken, requireRole } = require('../../shared/middleware/auth');
const { createLoginLimiter, createPasswordResetLimiter } = require('../../shared/middleware/rateLimiter');
const passport = require('../../shared/config/passport');

/**
 * Middleware for validering
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// ============================================================================
// AUTENTISERING
// ============================================================================

/**
 * POST /api/auth/login
 * Logg inn med e-post og passord
 */
router.post(
  '/auth/login',
  createLoginLimiter(),
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  controller.login
);

/**
 * POST /api/auth/logout
 * Logg ut bruker
 */
router.post('/auth/logout', controller.logout);

/**
 * GET /api/auth/me
 * Hent innlogget bruker
 */
router.get('/auth/me', authenticateToken, controller.me);

/**
 * POST /api/auth/forgot-password
 * Be om passordtilbakestilling
 */
router.post(
  '/auth/forgot-password',
  createPasswordResetLimiter(),
  [body('email').isEmail().normalizeEmail()],
  validate,
  controller.forgotPassword
);

/**
 * POST /api/auth/reset-password
 * Tilbakestill passord med token
 */
router.post(
  '/auth/reset-password',
  createPasswordResetLimiter(),
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 8 }),
  ],
  validate,
  controller.resetPassword
);

// ============================================================================
// OAUTH
// ============================================================================

/**
 * GET /api/auth/google
 * Initier Google OAuth
 */
router.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

/**
 * GET /api/auth/google/callback
 * Google OAuth callback
 */
router.get(
  '/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  controller.handleOAuthCallback
);

/**
 * GET /api/auth/facebook
 * Initier Facebook OAuth
 */
router.get(
  '/auth/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
);

/**
 * GET /api/auth/facebook/callback
 * Facebook OAuth callback
 */
router.get(
  '/auth/facebook/callback',
  passport.authenticate('facebook', { session: false, failureRedirect: '/login' }),
  controller.handleOAuthCallback
);

// ============================================================================
// BRUKERADMINISTRASJON
// ============================================================================

/**
 * GET /api/users
 * Liste alle brukere (kun admin)
 */
router.get(
  '/users',
  authenticateToken,
  requireRole(['admin']),
  controller.list
);

/**
 * GET /api/users/:id
 * Hent bruker med ID
 */
router.get(
  '/users/:id',
  authenticateToken,
  controller.get
);

/**
 * POST /api/users
 * Opprett ny bruker (kun admin)
 */
router.post(
  '/users',
  authenticateToken,
  requireRole(['admin']),
  [
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('roles').optional().isArray(),
    body('competenceGroups').optional().isArray(),
  ],
  validate,
  controller.create
);

/**
 * PUT /api/users/:id
 * Oppdater bruker
 */
router.put(
  '/users/:id',
  authenticateToken,
  [
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('roles').optional().isArray(),
    body('competenceGroups').optional().isArray(),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  controller.update
);

/**
 * DELETE /api/users/:id
 * Slett bruker (kun admin)
 */
router.delete(
  '/users/:id',
  authenticateToken,
  requireRole(['admin']),
  controller.remove
);

module.exports = router;


