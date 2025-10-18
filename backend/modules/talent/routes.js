/**
 * Kompetanse Routes
 * Definerer alle API-endepunkter for kompetansemodulen
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
// KOMPETANSEKATEGORIER
// ============================================================================

/**
 * GET /api/kompetanse/kategorier
 * Liste alle kompetansekategorier
 */
router.get(
  '/kategorier',
  authenticateToken,
  controller.listKategorier
);

/**
 * GET /api/kompetanse/kategorier/:id
 * Hent kompetansekategori med ID
 */
router.get(
  '/kategorier/:id',
  authenticateToken,
  controller.getKategori
);

/**
 * POST /api/kompetanse/kategorier
 * Opprett ny kompetansekategori (kun admin)
 */
router.post(
  '/kategorier',
  authenticateToken,
  requireRole(['admin']),
  [
    body('navn').trim().notEmpty().withMessage('Navn er påkrevd'),
    body('parentId').optional().isInt().withMessage('Parent ID må være et tall'),
    body('beskrivelse').optional().trim(),
  ],
  validate,
  controller.createKategori
);

/**
 * PUT /api/kompetanse/kategorier/:id
 * Oppdater kompetansekategori (kun admin)
 */
router.put(
  '/kategorier/:id',
  authenticateToken,
  requireRole(['admin']),
  [
    body('navn').optional().trim().notEmpty(),
    body('parentId').optional().isInt().withMessage('Parent ID må være et tall'),
    body('beskrivelse').optional().trim(),
  ],
  validate,
  controller.updateKategori
);

/**
 * DELETE /api/kompetanse/kategorier/:id
 * Slett kompetansekategori (kun admin)
 */
router.delete(
  '/kategorier/:id',
  authenticateToken,
  requireRole(['admin']),
  controller.deleteKategori
);

// ============================================================================
// KOMPETANSER
// ============================================================================

// DELETED: GET /api/kompetanse/bruker/:userId
// Endpoint removed - used non-existent tables
// Use GET /api/users/:id/talents instead

/**
 * GET /api/kompetanse
 * Liste alle kompetanser
 */
router.get(
  '/',
  authenticateToken,
  controller.list
);

/**
 * GET /api/kompetanse/:id
 * Hent kompetanse med ID
 */
router.get(
  '/:id',
  authenticateToken,
  controller.get
);

// DELETED: GET /api/kompetanse/:id/brukere
// Endpoint removed - used non-existent tables
// Query users with specific talent via bruker module instead

/**
 * POST /api/kompetanse
 * Opprett ny kompetanse (kun admin)
 */
router.post(
  '/',
  authenticateToken,
  requireRole(['admin']),
  [
    body('navn').trim().notEmpty().withMessage('Navn er påkrevd'),
    body('kategoriId').isInt().withMessage('Kategori ID må være et tall'),
    body('lederId').optional().isInt(),
    body('beskrivelse').optional().trim(),
  ],
  validate,
  controller.create
);

/**
 * PUT /api/kompetanse/:id
 * Oppdater kompetanse (kun admin)
 */
router.put(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  [
    body('navn').optional().trim().notEmpty(),
    body('kategoriId').optional().isInt(),
    body('lederId').optional().isInt(),
    body('beskrivelse').optional().trim(),
  ],
  validate,
  controller.update
);

/**
 * DELETE /api/kompetanse/:id
 * Slett kompetanse (kun admin)
 */
router.delete(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  controller.remove
);

module.exports = router;


