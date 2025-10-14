/**
 * Bemanning Controller
 * Håndterer HTTP-requests og responses for bemanning (medarbeidere i produksjoner)
 */

const service = require('./service');

const getBemanning = async (req, res) => {
  try {
    const { id } = req.params;
    const bemanning = await service.findBemanningByProduksjonId(id);
    res.json({ bemanning });
  } catch (error) {
    console.error('[BEMANNING] Get bemanning error:', error);
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
    console.error('[BEMANNING] Add bemanning error:', error);
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
    console.error('[BEMANNING] Update bemanning error:', error);
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
    console.error('[BEMANNING] Remove bemanning error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getBemanning,
  addBemanning,
  updateBemanning,
  removeBemanning,
};

