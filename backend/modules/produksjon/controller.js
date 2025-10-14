/**
 * Produksjon Controller
 * Håndterer HTTP-requests og responses for produksjon-endepunkter
 */

const service = require('./service');

// ============================================================================
// PRODUKSJONSPLANER
// ============================================================================

const listPlaner = async (req, res) => {
  try {
    const planer = await service.findAllPlaner();
    res.json({ planer });
  } catch (error) {
    console.error('[PRODUKSJON] List planer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await service.findPlanById(id);
    
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    res.json({ plan });
  } catch (error) {
    console.error('[PRODUKSJON] Get plan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createPlan = async (req, res) => {
  try {
    const { navn, beskrivelse, startDato, sluttDato } = req.body;
    const plan = await service.createPlan({ navn, beskrivelse, startDato, sluttDato });
    res.status(201).json({ plan });
  } catch (error) {
    console.error('[PRODUKSJON] Create plan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { navn, beskrivelse, startDato, sluttDato } = req.body;
    
    const plan = await service.updatePlan(id, { navn, beskrivelse, startDato, sluttDato });
    
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    res.json({ plan });
  } catch (error) {
    console.error('[PRODUKSJON] Update plan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await service.deletePlan(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    res.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('[PRODUKSJON] Delete plan error:', error);
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Kan ikke slette plan som har tilknyttede produksjoner' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ============================================================================
// PRODUKSJONSKATEGORIER
// ============================================================================

const listKategorier = async (req, res) => {
  try {
    const kategorier = await service.findAllKategorier();
    res.json({ kategorier });
  } catch (error) {
    console.error('[PRODUKSJON] List kategorier error:', error);
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
    console.error('[PRODUKSJON] Get kategori error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createKategori = async (req, res) => {
  try {
    const { navn, beskrivelse, plassering } = req.body;
    const kategori = await service.createKategori({ navn, beskrivelse, plassering });
    res.status(201).json({ kategori });
  } catch (error) {
    console.error('[PRODUKSJON] Create kategori error:', error);
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
    console.error('[PRODUKSJON] Update kategori error:', error);
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
    console.error('[PRODUKSJON] Delete kategori error:', error);
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
    console.error('[PRODUKSJON] Get talent-mal error:', error);
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
    console.error('[PRODUKSJON] Add talent to mal error:', error);
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
    console.error('[PRODUKSJON] Update talent in mal error:', error);
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
    console.error('[PRODUKSJON] Remove talent from mal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ============================================================================
// PRODUKSJONER
// ============================================================================

const list = async (req, res) => {
  try {
    const { kategoriId, planId, publisert, kommende, gjennomfort } = req.query;
    const produksjoner = await service.findAll({ 
      kategoriId, 
      planId, 
      publisert: publisert === 'true' ? true : publisert === 'false' ? false : undefined,
      kommende: kommende === 'true',
      gjennomfort: gjennomfort === 'true',
    });
    res.json({ produksjoner });
  } catch (error) {
    console.error('[PRODUKSJON] List produksjoner error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const get = async (req, res) => {
  try {
    const { id } = req.params;
    const produksjon = await service.findById(id);
    
    if (!produksjon) {
      return res.status(404).json({ error: 'Produksjon not found' });
    }
    
    res.json({ produksjon });
  } catch (error) {
    console.error('[PRODUKSJON] Get produksjon error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const create = async (req, res) => {
  try {
  const { navn, tid, kategoriId, publisert, beskrivelse, planId, applyTalentMal, plassering } = req.body;
    const produksjon = await service.create({
      navn,
      tid,
      kategoriId,
      publisert,
      beskrivelse,
      planId,
      applyTalentMal,
      plassering,
    });
    
    // Hvis talent-mal skal anvendes, hent malen og returner den sammen med produksjonen
    if (applyTalentMal && kategoriId) {
      const talentMal = await service.findTalentMalByKategoriId(kategoriId);
      return res.status(201).json({ produksjon, talentMal });
    }
    
    res.status(201).json({ produksjon });
  } catch (error) {
    console.error('[PRODUKSJON] Create produksjon error:', error);
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Ugyldig plan' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { navn, tid, kategoriId, publisert, beskrivelse, planId, plassering } = req.body;
    
    const produksjon = await service.update(id, {
      navn,
      tid,
      kategoriId,
      publisert,
      beskrivelse,
      planId,
      plassering,
    });
    
    if (!produksjon) {
      return res.status(404).json({ error: 'Produksjon not found' });
    }
    
    res.json({ produksjon });
  } catch (error) {
    console.error('[PRODUKSJON] Update produksjon error:', error);
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Ugyldig kategori eller plan' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await service.remove(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Produksjon not found' });
    }
    
    res.json({ message: 'Produksjon deleted successfully' });
  } catch (error) {
    console.error('[PRODUKSJON] Delete produksjon error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const produksjoner = await service.findByUserId(userId);
    res.json({ produksjoner });
  } catch (error) {
    console.error('[PRODUKSJON] Get by userId error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ============================================================================
// BEMANNING
// ============================================================================

const getBemanning = async (req, res) => {
  try {
    const { id } = req.params;
    const bemanning = await service.findBemanningByProduksjonId(id);
    res.json({ bemanning });
  } catch (error) {
    console.error('[PRODUKSJON] Get bemanning error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const addBemanning = async (req, res) => {
  try {
    const { id } = req.params;
    const { personId, talentId, notater, status } = req.body;
    
    const bemanning = await service.addBemanning({
      produksjonId: id,
      personId,
      talentId,
      notater,
      status,
    });
    
    res.status(201).json({ bemanning });
  } catch (error) {
    console.error('[PRODUKSJON] Add bemanning error:', error);
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Ugyldig produksjon, person eller talent' });
    }
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Person er allerede tildelt dette talentet i produksjonen' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateBemanning = async (req, res) => {
  try {
    const { bemanningId } = req.params;
    const { notater, status } = req.body;
    
    const bemanning = await service.updateBemanning(bemanningId, { notater, status });
    
    if (!bemanning) {
      return res.status(404).json({ error: 'Bemanning not found' });
    }
    
    res.json({ bemanning });
  } catch (error) {
    console.error('[PRODUKSJON] Update bemanning error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const removeBemanning = async (req, res) => {
  try {
    const { bemanningId } = req.params;
    const deleted = await service.removeBemanning(bemanningId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Bemanning not found' });
    }
    
    res.json({ message: 'Bemanning removed successfully' });
  } catch (error) {
    console.error('[PRODUKSJON] Remove bemanning error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  // Planer
  listPlaner,
  getPlan,
  createPlan,
  updatePlan,
  deletePlan,
  
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
  
  // Produksjoner
  list,
  get,
  create,
  update,
  remove,
  getByUserId,
  
  // Bemanning
  getBemanning,
  addBemanning,
  updateBemanning,
  removeBemanning,
};


