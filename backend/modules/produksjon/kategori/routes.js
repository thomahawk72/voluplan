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

// ============================================================================
// KATEGORI PLAN-MAL
// ============================================================================

// Hent plan-mal for kategori
router.get('/:id/plan-mal', authenticateToken, controller.getPlanMal);

// Legg til element i plan-mal
router.post('/:id/plan-mal', authenticateToken, requireRole(['admin']), [
  body('type').isIn(['overskrift', 'hendelse']),
  body('navn').trim().notEmpty(),
  body('varighetMinutter').optional().isInt({ min: 0 }),
  body('parentId').optional().isInt(),
  body('rekkefølge').optional().isInt({ min: 0 }),
], validate, controller.addPlanMalElement);

// Oppdater element i plan-mal
router.put('/:id/plan-mal/:elementId', authenticateToken, requireRole(['admin']), [
  body('navn').optional().trim().notEmpty(),
  body('varighetMinutter').optional().isInt({ min: 0 }),
  body('rekkefølge').optional().isInt({ min: 0 }),
], validate, controller.updatePlanMalElement);

// Oppdater kun rekkefølge på element
router.patch('/:id/plan-mal/:elementId/rekkefølge', authenticateToken, requireRole(['admin']), [
  body('rekkefølge').isInt({ min: 0 }),
], validate, controller.updatePlanMalRekkefølge);

// Fjern element fra plan-mal
router.delete('/:id/plan-mal/:elementId', authenticateToken, requireRole(['admin']), controller.removePlanMalElement);

// ============================================================================
// KATEGORI OPPMØTE-MAL
// ============================================================================

// Hent oppmøte-mal for kategori
router.get('/:id/oppmote-mal', authenticateToken, controller.getOppmoteMal);

// Legg til oppmøtetid i mal
router.post('/:id/oppmote-mal', authenticateToken, requireRole(['admin']), [
  body('navn').trim().notEmpty(),
  body('beskrivelse').optional().trim(),
  body('minutterFørStart').optional().isInt({ min: 0 }),
  body('rekkefølge').optional().isInt({ min: 0 }),
], validate, controller.addOppmoteToMal);

// Oppdater oppmøtetid i mal
router.put('/:id/oppmote-mal/:oppmoteId', authenticateToken, requireRole(['admin']), [
  body('navn').optional().trim().notEmpty(),
  body('beskrivelse').optional().trim(),
  body('minutterFørStart').optional().isInt({ min: 0 }),
  body('rekkefølge').optional().isInt({ min: 0 }),
], validate, controller.updateOppmoteInMal);

// Oppdater kun rekkefølge på oppmøtetid
router.patch('/:id/oppmote-mal/:oppmoteId/rekkefølge', authenticateToken, requireRole(['admin']), [
  body('rekkefølge').isInt({ min: 0 }),
], validate, controller.updateOppmoteRekkefølge);

// Fjern oppmøtetid fra mal
router.delete('/:id/oppmote-mal/:oppmoteId', authenticateToken, requireRole(['admin']), controller.removeOppmoteFromMal);

// ============================================================================
// KOMPLETT KATEGORI-MAL
// ============================================================================

// Hent komplett mal for kategori (talent, plan, oppmøte)
router.get('/:id/komplett-mal', authenticateToken, controller.getKomplettMal);

module.exports = router;

