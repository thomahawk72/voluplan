/**
 * Kategori Controller
 * Håndterer HTTP-requests og responses for produksjonskategorier og talent-maler
 */

const service = require('./service');

// ============================================================================
// PRODUKSJONSKATEGORIER
// ============================================================================

const listKategorier = async (req, res) => {
  try {
    const kategorier = await service.findAllKategorier();
    res.json({ kategorier });
  } catch (error) {
    console.error('[KATEGORI] List kategorier error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getKategori = async (req, res) => {
  try {
    const { id } = req.params;
    const kategori = await service.findKategoriById(id);
    
    if (!kategori) {
      return res.status(404).json({ error: 'Kategori not found' });
    }
    
    res.json({ kategori });
  } catch (error) {
    console.error('[KATEGORI] Get kategori error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createKategori = async (req, res) => {
  try {
    const { navn, beskrivelse, plassering } = req.body;
    const kategori = await service.createKategori({ navn, beskrivelse, plassering });
    res.status(201).json({ kategori });
  } catch (error) {
    console.error('[KATEGORI] Create kategori error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Kategori med dette navnet finnes allerede' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateKategori = async (req, res) => {
  try {
    const { id } = req.params;
    const { navn, beskrivelse, plassering } = req.body;
    
    const kategori = await service.updateKategori(id, { navn, beskrivelse, plassering });
    
    if (!kategori) {
      return res.status(404).json({ error: 'Kategori not found' });
    }
    
    res.json({ kategori });
  } catch (error) {
    console.error('[KATEGORI] Update kategori error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Kategori med dette navnet finnes allerede' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteKategori = async (req, res) => {
  try {
    const { id } = req.params;
    const deep = req.query.deep === 'true';
    const deleted = deep ? await service.deleteKategoriDeep(id) : await service.deleteKategori(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Kategori not found' });
    }
    
    res.json({ message: 'Kategori deleted successfully' });
  } catch (error) {
    console.error('[KATEGORI] Delete kategori error:', error);
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Kan ikke slette kategori som har tilknyttede produksjoner' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ============================================================================
// KATEGORI TALENT-MAL
// ============================================================================

const getTalentMal = async (req, res) => {
  try {
    const { id } = req.params;
    const talentMal = await service.findTalentMalByKategoriId(id);
    res.json({ talentMal });
  } catch (error) {
    console.error('[KATEGORI] Get talent-mal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const addTalentToMal = async (req, res) => {
  try {
    const { id } = req.params;
    const { talentId, antall, beskrivelse } = req.body;
    
    const talentMal = await service.addTalentToKategoriMal({
      kategoriId: id,
      talentId,
      antall,
      beskrivelse,
    });
    
    res.status(201).json({ talentMal });
  } catch (error) {
    console.error('[KATEGORI] Add talent to mal error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Dette talentet finnes allerede i malen' });
    }
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Ugyldig kategori eller talent' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateTalentInMal = async (req, res) => {
  try {
    const { malId } = req.params;
    const { antall, beskrivelse } = req.body;
    
    const talentMal = await service.updateTalentInKategoriMal(malId, { antall, beskrivelse });
    
    if (!talentMal) {
      return res.status(404).json({ error: 'Talent-mal not found' });
    }
    
    res.json({ talentMal });
  } catch (error) {
    console.error('[KATEGORI] Update talent in mal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const removeTalentFromMal = async (req, res) => {
  try {
    const { malId } = req.params;
    const deleted = await service.removeTalentFromKategoriMal(malId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Talent-mal not found' });
    }
    
    res.json({ message: 'Talent removed from mal successfully' });
  } catch (error) {
    console.error('[KATEGORI] Remove talent from mal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ============================================================================
// KATEGORI PLAN-MAL
// ============================================================================

const getPlanMal = async (req, res) => {
  try {
    const { id } = req.params;
    const planMal = await service.findPlanMalByKategoriId(id);
    res.json({ planMal });
  } catch (error) {
    console.error('[KATEGORI] Get plan-mal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const addPlanMalElement = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, navn, varighetMinutter, parentId, rekkefølge } = req.body;
    
    const element = await service.addPlanMalElement({
      kategoriId: id,
      type,
      navn,
      varighetMinutter,
      parentId,
      rekkefølge,
    });
    
    res.status(201).json({ element });
  } catch (error) {
    console.error('[KATEGORI] Add plan-mal element error:', error);
    if (error.code === '23514') { // Check constraint violation
      return res.status(400).json({ error: 'Ugyldig element-struktur. Overskrifter må ha parent_id=null, hendelser må ha parent_id og varighet.' });
    }
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Ugyldig kategori eller parent' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updatePlanMalElement = async (req, res) => {
  try {
    const { elementId } = req.params;
    const { navn, varighetMinutter, rekkefølge } = req.body;
    
    const element = await service.updatePlanMalElement(elementId, { navn, varighetMinutter, rekkefølge });
    
    if (!element) {
      return res.status(404).json({ error: 'Plan-mal element not found' });
    }
    
    res.json({ element });
  } catch (error) {
    console.error('[KATEGORI] Update plan-mal element error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updatePlanMalRekkefølge = async (req, res) => {
  try {
    const { elementId } = req.params;
    const { rekkefølge } = req.body;
    
    const element = await service.updatePlanMalRekkefølge(elementId, rekkefølge);
    
    if (!element) {
      return res.status(404).json({ error: 'Plan-mal element not found' });
    }
    
    res.json({ element });
  } catch (error) {
    console.error('[KATEGORI] Update plan-mal rekkefølge error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const removePlanMalElement = async (req, res) => {
  try {
    const { elementId } = req.params;
    const deleted = await service.removePlanMalElement(elementId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Plan-mal element not found' });
    }
    
    res.json({ message: 'Plan-mal element deleted successfully' });
  } catch (error) {
    console.error('[KATEGORI] Remove plan-mal element error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ============================================================================
// KATEGORI OPPMØTE-MAL
// ============================================================================

const getOppmoteMal = async (req, res) => {
  try {
    const { id } = req.params;
    const oppmoteMal = await service.findOppmoteMalByKategoriId(id);
    res.json({ oppmoteMal });
  } catch (error) {
    console.error('[KATEGORI] Get oppmøte-mal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const addOppmoteToMal = async (req, res) => {
  try {
    const { id } = req.params;
    const { navn, beskrivelse, minutterFørStart, rekkefølge } = req.body;
    
    const oppmote = await service.addOppmoteToKategoriMal({
      kategoriId: id,
      navn,
      beskrivelse,
      minutterFørStart,
      rekkefølge,
    });
    
    res.status(201).json({ oppmote });
  } catch (error) {
    console.error('[KATEGORI] Add oppmøte to mal error:', error);
    if (error.code === '23514') {
      return res.status(400).json({ error: 'Ugyldig oppmøtetid. Minutter før start må være >= 0.' });
    }
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Ugyldig kategori' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateOppmoteInMal = async (req, res) => {
  try {
    const { oppmoteId } = req.params;
    const { navn, beskrivelse, minutterFørStart, rekkefølge } = req.body;
    
    const oppmote = await service.updateOppmoteInKategoriMal(oppmoteId, {
      navn,
      beskrivelse,
      minutterFørStart,
      rekkefølge,
    });
    
    if (!oppmote) {
      return res.status(404).json({ error: 'Oppmøtetid not found' });
    }
    
    res.json({ oppmote });
  } catch (error) {
    console.error('[KATEGORI] Update oppmøte in mal error:', error);
    if (error.code === '23514') {
      return res.status(400).json({ error: 'Ugyldig oppmøtetid. Minutter før start må være >= 0.' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateOppmoteRekkefølge = async (req, res) => {
  try {
    const { oppmoteId } = req.params;
    const { rekkefølge } = req.body;
    
    const oppmote = await service.updateOppmoteRekkefølge(oppmoteId, rekkefølge);
    
    if (!oppmote) {
      return res.status(404).json({ error: 'Oppmøtetid not found' });
    }
    
    res.json({ oppmote });
  } catch (error) {
    console.error('[KATEGORI] Update oppmøte rekkefølge error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const removeOppmoteFromMal = async (req, res) => {
  try {
    const { oppmoteId } = req.params;
    const deleted = await service.removeOppmoteFromKategoriMal(oppmoteId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Oppmøtetid not found' });
    }
    
    res.json({ message: 'Oppmøtetid deleted successfully' });
  } catch (error) {
    console.error('[KATEGORI] Remove oppmøte from mal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ============================================================================
// KOMPLETT KATEGORI-MAL
// ============================================================================

const getKomplettMal = async (req, res) => {
  try {
    const { id } = req.params;
    const komplettMal = await service.findKomplettMalByKategoriId(id);
    
    if (!komplettMal) {
      return res.status(404).json({ error: 'Kategori not found' });
    }
    
    res.json(komplettMal);
  } catch (error) {
    console.error('[KATEGORI] Get komplett mal error:', error);
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
  
  // Kategori talent-mal
  getTalentMal,
  addTalentToMal,
  updateTalentInMal,
  removeTalentFromMal,
  
  // Kategori plan-mal
  getPlanMal,
  addPlanMalElement,
  updatePlanMalElement,
  updatePlanMalRekkefølge,
  removePlanMalElement,
  
  // Kategori oppmøte-mal
  getOppmoteMal,
  addOppmoteToMal,
  updateOppmoteInMal,
  updateOppmoteRekkefølge,
  removeOppmoteFromMal,
  
  // Komplett kategori-mal
  getKomplettMal,
};

