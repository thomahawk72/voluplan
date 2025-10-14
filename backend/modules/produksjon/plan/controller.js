/**
 * Plan Controller
 * Håndterer HTTP-requests og responses for produksjonsplaner
 */

const service = require('./service');

const listPlaner = async (req, res) => {
  try {
    const planer = await service.findAllPlaner();
    res.json({ planer });
  } catch (error) {
    console.error('[PLAN] List planer error:', error);
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
    console.error('[PLAN] Get plan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createPlan = async (req, res) => {
  try {
    const { navn, beskrivelse, startDato, sluttDato } = req.body;
    const plan = await service.createPlan({ navn, beskrivelse, startDato, sluttDato });
    res.status(201).json({ plan });
  } catch (error) {
    console.error('[PLAN] Create plan error:', error);
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
    console.error('[PLAN] Update plan error:', error);
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
    console.error('[PLAN] Delete plan error:', error);
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Kan ikke slette plan som har tilknyttede produksjoner' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  listPlaner,
  getPlan,
  createPlan,
  updatePlan,
  deletePlan,
};

