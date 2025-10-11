/**
 * Kompetanse Controller
 * Håndterer HTTP-requests og responses for kompetanse-endepunkter
 */

const service = require('./service');

// ============================================================================
// KOMPETANSEKATEGORIER
// ============================================================================

/**
 * GET /api/kompetanse/kategorier
 * Liste alle kompetansekategorier
 */
const listKategorier = async (req, res) => {
  try {
    const kategorier = await service.findAllKategorier();
    res.json({ kategorier });
  } catch (error) {
    console.error('[KOMPETANSE] List kategorier error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/kompetanse/kategorier/:id
 * Hent kompetansekategori med ID
 */
const getKategori = async (req, res) => {
  try {
    const { id } = req.params;
    const kategori = await service.findKategoriById(id);
    
    if (!kategori) {
      return res.status(404).json({ error: 'Kategori not found' });
    }
    
    res.json({ kategori });
  } catch (error) {
    console.error('[KOMPETANSE] Get kategori error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/kompetanse/kategorier
 * Opprett ny kompetansekategori
 */
const createKategori = async (req, res) => {
  try {
    const { navn, parentId, beskrivelse } = req.body;
    
    // Sjekk at parent ikke har talenter (kan ikke ha både sub-kategorier og talenter)
    if (parentId) {
      const talenterIParen = await service.findAll({ kategoriId: parentId });
      if (talenterIParen.length > 0) {
        return res.status(400).json({ 
          error: 'Kan ikke opprette sub-kategori. Kategorien har allerede talenter. En kategori kan ikke ha både talenter og sub-kategorier.' 
        });
      }
    }
    
    const kategori = await service.createKategori({ navn, parentId, beskrivelse });
    res.status(201).json({ kategori });
  } catch (error) {
    console.error('[KOMPETANSE] Create kategori error:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Kategori med dette navnet finnes allerede for denne parent' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PUT /api/kompetanse/kategorier/:id
 * Oppdater kompetansekategori
 */
const updateKategori = async (req, res) => {
  try {
    const { id } = req.params;
    const { navn, parentId, beskrivelse } = req.body;
    
    const kategori = await service.updateKategori(id, { navn, parentId, beskrivelse });
    
    if (!kategori) {
      return res.status(404).json({ error: 'Kategori not found' });
    }
    
    res.json({ kategori });
  } catch (error) {
    console.error('[KOMPETANSE] Update kategori error:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Kategori med dette navnet finnes allerede' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * DELETE /api/kompetanse/kategorier/:id
 * Slett kompetansekategori
 */
const deleteKategori = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await service.deleteKategori(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Kategori not found' });
    }
    
    res.json({ message: 'Kategori deleted successfully' });
  } catch (error) {
    console.error('[KOMPETANSE] Delete kategori error:', error);
    if (error.code === '23503') { // Foreign key violation
      const detail = error.detail || '';
      if (detail.includes('talent')) {
        return res.status(400).json({ error: 'Kan ikke slette kategori som har talenter. Slett talentene først.' });
      }
      if (detail.includes('talentkategori')) {
        return res.status(400).json({ error: 'Kan ikke slette kategori som har sub-kategorier. Slett sub-kategoriene først.' });
      }
      return res.status(400).json({ error: 'Kan ikke slette kategori som er i bruk' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ============================================================================
// KOMPETANSER
// ============================================================================

/**
 * GET /api/kompetanse
 * Liste alle kompetanser
 */
const list = async (req, res) => {
  try {
    const { kategoriId, lederId } = req.query;
    const kompetanser = await service.findAll({ kategoriId, lederId });
    res.json({ kompetanser });
  } catch (error) {
    console.error('[KOMPETANSE] List kompetanser error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/kompetanse/:id
 * Hent kompetanse med ID
 */
const get = async (req, res) => {
  try {
    const { id } = req.params;
    const kompetanse = await service.findById(id);
    
    if (!kompetanse) {
      return res.status(404).json({ error: 'Kompetanse not found' });
    }
    
    res.json({ kompetanse });
  } catch (error) {
    console.error('[KOMPETANSE] Get kompetanse error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/kompetanse
 * Opprett ny kompetanse
 */
const create = async (req, res) => {
  try {
    const { navn, kategoriId, lederId, beskrivelse } = req.body;
    
    // Sjekk at kategorien ikke har sub-kategorier (kan ikke ha både talenter og sub-kategorier)
    const subKategorier = await service.findAllKategorier();
    const harSubKategorier = subKategorier.some(k => k.parent_id === kategoriId);
    
    if (harSubKategorier) {
      return res.status(400).json({ 
        error: 'Kan ikke opprette talent. Kategorien har allerede sub-kategorier. En kategori kan ikke ha både talenter og sub-kategorier.' 
      });
    }
    
    const kompetanse = await service.create({
      navn,
      kategoriId,
      lederId,
      beskrivelse,
    });
    res.status(201).json({ kompetanse });
  } catch (error) {
    console.error('[KOMPETANSE] Create kompetanse error:', error);
    if (error.code === '23503') { // Foreign key violation
      return res.status(400).json({ error: 'Ugyldig kategori eller leder' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PUT /api/kompetanse/:id
 * Oppdater kompetanse
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { navn, kategoriId, lederId, beskrivelse } = req.body;
    
    const kompetanse = await service.update(id, {
      navn,
      kategoriId,
      lederId,
      beskrivelse,
    });
    
    if (!kompetanse) {
      return res.status(404).json({ error: 'Kompetanse not found' });
    }
    
    res.json({ kompetanse });
  } catch (error) {
    console.error('[KOMPETANSE] Update kompetanse error:', error);
    if (error.code === '23503') { // Foreign key violation
      return res.status(400).json({ error: 'Ugyldig kategori eller leder' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * DELETE /api/kompetanse/:id
 * Slett kompetanse
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await service.remove(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Kompetanse not found' });
    }
    
    res.json({ message: 'Kompetanse deleted successfully' });
  } catch (error) {
    console.error('[KOMPETANSE] Delete kompetanse error:', error);
    if (error.code === '23503') { // Foreign key violation
      return res.status(400).json({ error: 'Kan ikke slette talent som brukes i produksjoner' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/kompetanse/bruker/:userId
 * Hent kompetanser for en bruker
 */
const getByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const kompetanser = await service.findByUserId(userId);
    res.json({ kompetanser });
  } catch (error) {
    console.error('[KOMPETANSE] Get by userId error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/kompetanse/:id/brukere
 * Hent brukere med en spesifikk kompetanse
 */
const getUsersByKompetanseId = async (req, res) => {
  try {
    const { id } = req.params;
    const brukere = await service.findUsersByKompetanseId(id);
    res.json({ brukere });
  } catch (error) {
    console.error('[KOMPETANSE] Get users by kompetanseId error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  // Kategorier
  listKategorier,
  getKategori,
  createKategori,
  updateKategori,
  deleteKategori,
  
  // Kompetanser
  list,
  get,
  create,
  update,
  remove,
  getByUserId,
  getUsersByKompetanseId,
};


