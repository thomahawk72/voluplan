/**
 * Kategori Routes
 * Definerer API-endepunkter for produksjonskategorier og talent-maler
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

// ============================================================================
// PRODUKSJONSKATEGORIER
// ============================================================================

// Liste alle kategorier
router.get('/', authenticateToken, controller.listKategorier);

// Hent kategori med ID
router.get('/:id', authenticateToken, controller.getKategori);

// Opprett ny kategori
router.post('/', authenticateToken, requireRole(['admin']), [
  body('navn').trim().notEmpty(),
  body('beskrivelse').optional().trim(),
  body('plassering').optional().trim(),
], validate, controller.createKategori);

// Oppdater kategori
router.put('/:id', authenticateToken, requireRole(['admin']), [
  body('navn').optional().trim().notEmpty(),
  body('beskrivelse').optional().trim(),
  body('plassering').optional().trim(),
], validate, controller.updateKategori);

// Slett kategori (støtter ?deep=true for å slette kategori + tilhørende maler)
router.delete('/:id', authenticateToken, requireRole(['admin']), controller.deleteKategori);

// ============================================================================
// KATEGORI TALENT-MAL
// ============================================================================

// Hent talent-mal for kategori
router.get('/:id/talent-mal', authenticateToken, controller.getTalentMal);

// Legg til talent i mal
router.post('/:id/talent-mal', authenticateToken, requireRole(['admin']), [
  body('talentId').isInt(),
  body('antall').optional().isInt({ min: 1 }),
  body('beskrivelse').optional().trim(),
], validate, controller.addTalentToMal);

// Oppdater talent i mal
router.put('/:id/talent-mal/:malId', authenticateToken, requireRole(['admin']), [
  body('antall').optional().isInt({ min: 1 }),
  body('beskrivelse').optional().trim(),
], validate, controller.updateTalentInMal);

// Fjern talent fra mal
router.delete('/:id/talent-mal/:malId', authenticateToken, requireRole(['admin']), controller.removeTalentFromMal);

module.exports = router;

