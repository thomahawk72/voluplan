/**
 * Bemanning Routes
 * Definerer API-endepunkter for bemanning (medarbeidere i produksjoner)
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

// Hent bemanning for produksjon
router.get('/:id/bemanning', authenticateToken, controller.getBemanning);

// Legg til person i produksjon
router.post('/:id/bemanning', authenticateToken, requireRole(['admin']), [
  body('personId').isInt(),
  body('talentNavn').trim().notEmpty().withMessage('Talent navn er påkrevd'),
  body('talentKategoriSti').trim().notEmpty().withMessage('Talent kategori sti er påkrevd'),
  body('notater').optional().trim(),
  body('status').optional().isIn(['planlagt', 'bekreftet', 'avlyst']),
], validate, controller.addBemanning);

// Oppdater bemanning
router.put('/:id/bemanning/:bemanningId', authenticateToken, requireRole(['admin']), [
  body('notater').optional().trim(),
  body('status').optional().isIn(['planlagt', 'bekreftet', 'avlyst']),
], validate, controller.updateBemanning);

// Fjern person fra produksjon
router.delete('/:id/bemanning/:bemanningId', authenticateToken, requireRole(['admin']), controller.removeBemanning);

module.exports = router;

