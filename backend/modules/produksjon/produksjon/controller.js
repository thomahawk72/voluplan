/**
 * Produksjon Controller
 * Håndterer HTTP-requests og responses for produksjoner
 */

const service = require('./service');
const kategoriService = require('../kategori/service');

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
  const { navn, tid, kategoriId, publisert, beskrivelse, planId, applyKategoriMal, plassering } = req.body;
    const produksjon = await service.create({
      navn,
      tid,
      kategoriId,
      publisert,
      beskrivelse,
      planId,
      applyKategoriMal,
      plassering,
    });
    
    // Hvis kategori-mal skal anvendes, returner produksjonen
    if (applyKategoriMal && kategoriId) {
      return res.status(201).json({ produksjon });
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

module.exports = {
  list,
  get,
  create,
  update,
  remove,
  getByUserId,
};

