/**
 * Plan Routes
 * Definerer API-endepunkter for produksjonsplaner
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const controller = require('./controller');
const { authenticateToken, requireRole } = require('../../../shared/middleware/auth');

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

// Liste alle planer
router.get('/', authenticateToken, controller.listPlaner);

// Hent plan med ID
router.get('/:id', authenticateToken, controller.getPlan);

// Opprett ny plan
router.post('/', authenticateToken, requireRole(['admin']), [
  body('navn').trim().notEmpty(),
  body('beskrivelse').optional().trim(),
  body('startDato').optional().isISO8601(),
  body('sluttDato').optional().isISO8601(),
], validate, controller.createPlan);

// Oppdater plan
router.put('/:id', authenticateToken, requireRole(['admin']), [
  body('navn').optional().trim().notEmpty(),
  body('beskrivelse').optional().trim(),
  body('startDato').optional().isISO8601(),
  body('sluttDato').optional().isISO8601(),
], validate, controller.updatePlan);

// Slett plan
router.delete('/:id', authenticateToken, requireRole(['admin']), controller.deletePlan);

module.exports = router;

