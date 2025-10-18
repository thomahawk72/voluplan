/**
 * Talent Controller
 * Håndterer HTTP-requests og responses for talent-endepunkter
 */

const service = require('./service');

// ============================================================================
// TALENT KATEGORIER
// ============================================================================

/**
 * GET /api/talent/kategorier
 * Liste alle talent kategorier
 */
const listKategorier = async (req, res) => {
  try {
    const kategorier = await service.findAllKategorier();
    res.json({ kategorier });
  } catch (error) {
    console.error('[TALENT] List kategorier error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/talent/kategorier/:id
 * Hent talent kategori med ID
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
    console.error('[TALENT] Get kategori error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/talent/kategorier
 * Opprett ny talent kategori
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
    console.error('[TALENT] Create kategori error:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Kategori med dette navnet finnes allerede for denne parent' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PUT /api/talent/kategorier/:id
 * Oppdater talent kategori
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
    console.error('[TALENT] Update kategori error:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Kategori med dette navnet finnes allerede' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * DELETE /api/talent/kategorier/:id
 * Slett talent kategori
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
    console.error('[TALENT] Delete kategori error:', error);
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
// TALENTER
// ============================================================================

/**
 * GET /api/talent
 * Liste alle talenter
 */
const list = async (req, res) => {
  try {
    const { kategoriId, lederId } = req.query;
    const talenter = await service.findAll({ kategoriId, lederId });
    res.json({ talenter });
  } catch (error) {
    console.error('[TALENT] List talenter error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/talent/:id
 * Hent talent med ID
 */
const get = async (req, res) => {
  try {
    const { id } = req.params;
    const talent = await service.findById(id);
    
    if (!talent) {
      return res.status(404).json({ error: 'Talent not found' });
    }
    
    res.json({ talent });
  } catch (error) {
    console.error('[TALENT] Get talent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/talent
 * Opprett ny talent
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
    
    const talent = await service.create({
      navn,
      kategoriId,
      lederId,
      beskrivelse,
    });
    res.status(201).json({ talent });
  } catch (error) {
    console.error('[TALENT] Create talent error:', error);
    if (error.code === '23503') { // Foreign key violation
      return res.status(400).json({ error: 'Ugyldig kategori eller leder' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PUT /api/talent/:id
 * Oppdater talent
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { navn, kategoriId, lederId, beskrivelse } = req.body;
    
    const talent = await service.update(id, {
      navn,
      kategoriId,
      lederId,
      beskrivelse,
    });
    
    if (!talent) {
      return res.status(404).json({ error: 'Talent not found' });
    }
    
    res.json({ talent });
  } catch (error) {
    console.error('[TALENT] Update talent error:', error);
    if (error.code === '23503') { // Foreign key violation
      return res.status(400).json({ error: 'Ugyldig kategori eller leder' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * DELETE /api/talent/:id
 * Slett talent
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await service.remove(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Talent not found' });
    }
    
    res.json({ message: 'Talent deleted successfully' });
  } catch (error) {
    console.error('[TALENT] Delete talent error:', error);
    if (error.code === '23503') { // Foreign key violation
      return res.status(400).json({ error: 'Kan ikke slette talent: ' + (error.detail || 'Foreign key constraint') });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETED: getByUserId and getUsersByKompetanseId
// These endpoints used service functions that referenced non-existent tables
// For user-talent relations, use /api/users/:id/talents instead (bruker module)

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
  // getByUserId and getUsersByKompetanseId REMOVED - used non-existent tables
};


