/**
 * Produksjon Routes
 * Definerer API-endepunkter for produksjoner
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const controller = require('./controller');
const { authenticateToken, requireRole, checkResourceOwnership } = require('../../../shared/middleware/auth');
const { createMutationLimiter } = require('../../../shared/middleware/rateLimiter');

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

// Hent produksjoner for en bruker
// Horizontal access control: Only admin or the user themselves can view their productions
router.get('/bruker/:userId', authenticateToken, checkResourceOwnership('userId', 'user-productions'), controller.getByUserId);

// Hent produksjon med ID
router.get('/:id', authenticateToken, controller.get);

// Liste alle produksjoner (med filter)
router.get('/', authenticateToken, controller.list);

// Opprett ny produksjon
// Rate limited: 20 requests per 15 min (expensive operation with category template copying)
router.post('/', authenticateToken, requireRole(['admin']), createMutationLimiter(), [
  body('navn').trim().notEmpty(),
  body('tid').isISO8601(),
  // kategoriId brukes kun ved oppretting for å kopiere mal/plassering, ikke lagres
  body('kategoriId').optional().isInt(),
  body('publisert').optional().isBoolean(),
  body('beskrivelse').optional().trim(),
  body('planId').optional().isInt(),
  body('plassering').optional().trim(),
  body('applyKategoriMal').optional().isBoolean(),
], validate, controller.create);

// Oppdater produksjon
router.put('/:id', authenticateToken, requireRole(['admin']), [
  body('navn').optional().trim().notEmpty(),
  body('tid').optional().isISO8601(),
  // kategoriId finnes ikke lenger på produksjon
  body('publisert').optional().isBoolean(),
  body('beskrivelse').optional().trim(),
  body('planId').optional().isInt(),
  body('plassering').optional().trim(),
], validate, controller.update);

// Slett produksjon
router.delete('/:id', authenticateToken, requireRole(['admin']), controller.remove);

module.exports = router;

