/**
 * Produksjon Routes (Aggregator)
 * Aggregerer alle delmoduler: plan, kategori, produksjon, bemanning
 */

const express = require('express');
const router = express.Router();

// Import delmodul routes
const planRoutes = require('./plan/routes');
const kategoriRoutes = require('./kategori/routes');
const produksjonRoutes = require('./produksjon/routes');
const bemanningRoutes = require('./bemanning/routes');

// Mount delmoduler
router.use('/planer', planRoutes);
router.use('/kategorier', kategoriRoutes);
router.use('/', bemanningRoutes);  // Bemanning bruker produksjon ID i path
router.use('/', produksjonRoutes);  // Produksjoner på root

module.exports = router;


