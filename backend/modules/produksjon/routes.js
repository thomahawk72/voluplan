/**
 * Produksjon Routes
 * Definerer alle API-endepunkter for produksjonsmodulen
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const controller = require('./controller');
const { authenticateToken, requireRole } = require('../../shared/middleware/auth');

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
// PRODUKSJONSPLANER
// ============================================================================

router.get('/planer', authenticateToken, controller.listPlaner);
router.get('/planer/:id', authenticateToken, controller.getPlan);
router.post('/planer', authenticateToken, requireRole(['admin']), [
  body('navn').trim().notEmpty(),
  body('beskrivelse').optional().trim(),
  body('startDato').optional().isISO8601(),
  body('sluttDato').optional().isISO8601(),
], validate, controller.createPlan);
router.put('/planer/:id', authenticateToken, requireRole(['admin']), [
  body('navn').optional().trim().notEmpty(),
  body('beskrivelse').optional().trim(),
  body('startDato').optional().isISO8601(),
  body('sluttDato').optional().isISO8601(),
], validate, controller.updatePlan);
router.delete('/planer/:id', authenticateToken, requireRole(['admin']), controller.deletePlan);

// ============================================================================
// PRODUKSJONSKATEGORIER
// ============================================================================

router.get('/kategorier', authenticateToken, controller.listKategorier);
router.get('/kategorier/:id', authenticateToken, controller.getKategori);
router.post('/kategorier', authenticateToken, requireRole(['admin']), [
  body('navn').trim().notEmpty(),
  body('beskrivelse').optional().trim(),
], validate, controller.createKategori);
router.put('/kategorier/:id', authenticateToken, requireRole(['admin']), [
  body('navn').optional().trim().notEmpty(),
  body('beskrivelse').optional().trim(),
], validate, controller.updateKategori);
router.delete('/kategorier/:id', authenticateToken, requireRole(['admin']), controller.deleteKategori);

// ============================================================================
// PRODUKSJONER
// ============================================================================

router.get('/bruker/:userId', authenticateToken, controller.getByUserId);
router.get('/:id/bemanning', authenticateToken, controller.getBemanning);
router.get('/:id', authenticateToken, controller.get);
router.get('/', authenticateToken, controller.list);

router.post('/', authenticateToken, requireRole(['admin']), [
  body('navn').trim().notEmpty(),
  body('tid').isISO8601(),
  body('kategoriId').optional().isInt(),
  body('publisert').optional().isBoolean(),
  body('beskrivelse').optional().trim(),
  body('planId').optional().isInt(),
], validate, controller.create);

router.put('/:id', authenticateToken, requireRole(['admin']), [
  body('navn').optional().trim().notEmpty(),
  body('tid').optional().isISO8601(),
  body('kategoriId').optional().isInt(),
  body('publisert').optional().isBoolean(),
  body('beskrivelse').optional().trim(),
  body('planId').optional().isInt(),
], validate, controller.update);

router.delete('/:id', authenticateToken, requireRole(['admin']), controller.remove);

// ============================================================================
// BEMANNING
// ============================================================================

router.post('/:id/bemanning', authenticateToken, requireRole(['admin']), [
  body('personId').isInt(),
  body('talentId').isInt(),
  body('notater').optional().trim(),
  body('status').optional().isIn(['planlagt', 'bekreftet', 'avlyst']),
], validate, controller.addBemanning);

router.put('/:id/bemanning/:bemanningId', authenticateToken, requireRole(['admin']), [
  body('notater').optional().trim(),
  body('status').optional().isIn(['planlagt', 'bekreftet', 'avlyst']),
], validate, controller.updateBemanning);

router.delete('/:id/bemanning/:bemanningId', authenticateToken, requireRole(['admin']), controller.removeBemanning);

module.exports = router;


