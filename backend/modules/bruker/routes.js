/**
 * Bruker Routes
 * Definerer alle API-endepunkter for brukermodulen
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const controller = require('./controller');
const { authenticateToken, requireRole, checkResourceOwnership } = require('../../shared/middleware/auth');
const { createLoginLimiter, createPasswordResetLimiter, createMutationLimiter } = require('../../shared/middleware/rateLimiter');
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
 * GET /api/users/with-talents
 * Hent brukere med talents (for bemanning)
 * Query params: ?talentId=123 for å filtrere på spesifikt talent
 */
router.get(
  '/users/with-talents',
  authenticateToken,
  controller.listWithTalents
);

/**
 * GET /api/users/:id
 * Hent bruker med ID
 * Horizontal access control: Only admin or the user themselves can view
 */
router.get(
  '/users/:id',
  authenticateToken,
  checkResourceOwnership('id', 'user'),
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
 * Horizontal access control: Only admin or the user themselves can update
 */
router.put(
  '/users/:id',
  authenticateToken,
  checkResourceOwnership('id', 'user'),
  [
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('email').optional().isEmail().normalizeEmail(),
    body('currentPassword').optional().notEmpty(),
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

/**
 * POST /api/users/bulk-delete
 * Slett flere brukere (kun admin)
 * Rate limited: 20 requests per 15 min (expensive operation)
 */
router.post(
  '/users/bulk-delete',
  authenticateToken,
  requireRole(['admin']),
  createMutationLimiter(), // Protect expensive bulk operation
  [
    body('userIds').isArray().withMessage('userIds må være en array'),
    body('userIds.*').isInt().withMessage('Alle user IDs må være tall'),
  ],
  validate,
  controller.bulkDelete
);

// ============================================================================
// BRUKER-TALENT RELASJONER
// ============================================================================

/**
 * GET /api/users/:id/talents
 * Hent alle talents for en bruker
 * Horizontal access control: Only admin or the user themselves can view their talents
 */
router.get(
  '/users/:id/talents',
  authenticateToken,
  checkResourceOwnership('id', 'user-talents'),
  controller.getUserTalents
);

/**
 * POST /api/users/:id/talents
 * Legg til talent for bruker (kun admin)
 */
router.post(
  '/users/:id/talents',
  authenticateToken,
  requireRole(['admin']),
  [
    body('talentId').isInt().withMessage('talentId må være et tall'),
    body('erfaringsnivaa').optional().isIn(['grunnleggende', 'middels', 'avansert', 'ekspert']),
    body('notater').optional().isString(),
  ],
  validate,
  controller.addUserTalent
);

/**
 * PUT /api/users/:userId/talents/:talentId
 * Oppdater bruker-talent relasjon (kun admin)
 */
router.put(
  '/users/:userId/talents/:talentId',
  authenticateToken,
  requireRole(['admin']),
  [
    body('erfaringsnivaa').optional().isIn(['grunnleggende', 'middels', 'avansert', 'ekspert']),
    body('notater').optional().isString(),
  ],
  validate,
  controller.updateUserTalent
);

/**
 * DELETE /api/users/:userId/talents/:talentId
 * Fjern talent fra bruker (kun admin)
 */
router.delete(
  '/users/:userId/talents/:talentId',
  authenticateToken,
  requireRole(['admin']),
  controller.removeUserTalent
);

module.exports = router;


