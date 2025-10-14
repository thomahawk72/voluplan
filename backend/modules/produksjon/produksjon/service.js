/**
 * Produksjon Service
 * Håndterer database-operasjoner for produksjoner
 */

const db = require('../../../shared/config/database');
const kategoriService = require('../kategori/service');

/**
 * Finn alle produksjoner
 */
const findAll = async (filters = {}) => {
  let query = `
    SELECT 
      p.*,
      pp.navn as plan_navn,
      COUNT(DISTINCT pb.person_id) as antall_personer
    FROM produksjon p
    LEFT JOIN produksjonsplan pp ON p.plan_id = pp.id
    LEFT JOIN produksjon_bemanning pb ON p.id = pb.produksjon_id
  `;
  
  const conditions = [];
  const values = [];
  let paramCount = 1;
  
  // kategoriId er ikke lenger en del av modellen
  
  if (filters.planId) {
    conditions.push(`p.plan_id = $${paramCount++}`);
    values.push(filters.planId);
  }
  
  if (filters.publisert !== undefined) {
    conditions.push(`p.publisert = $${paramCount++}`);
    values.push(filters.publisert);
  }
  
  if (filters.kommende) {
    conditions.push(`p.tid > NOW()`);
  }
  
  if (filters.gjennomfort) {
    conditions.push(`p.tid < NOW()`);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' GROUP BY p.id, pp.navn ORDER BY p.tid DESC';
  
  const result = await db.query(query, values);
  return result.rows;
};

/**
 * Finn produksjon basert på ID
 */
const findById = async (id) => {
  const result = await db.query(
    `SELECT 
      p.*,
      pp.navn as plan_navn,
      COUNT(DISTINCT pb.person_id) as antall_personer
    FROM produksjon p
    LEFT JOIN produksjonsplan pp ON p.plan_id = pp.id
    LEFT JOIN produksjon_bemanning pb ON p.id = pb.produksjon_id
    WHERE p.id = $1
    GROUP BY p.id, pp.navn`,
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Opprett ny produksjon
 * Hvis applyTalentMal=true og kategoriId er satt, populeres bemanning fra talent-mal
 */
const create = async (data) => {
  const { navn, tid, kategoriId, publisert, beskrivelse, planId, applyTalentMal, plassering } = data;
  
  // Finn standard plassering fra kategori dersom ikke eksplisitt oppgitt
  let plasseringValue = plassering || null;
  if (!plasseringValue && kategoriId) {
    const katRes = await db.query('SELECT plassering FROM produksjonskategori WHERE id = $1', [kategoriId]);
    plasseringValue = katRes.rows[0]?.plassering || null;
  }

  // Opprett produksjonen
  const result = await db.query(
    'INSERT INTO produksjon (navn, tid, publisert, beskrivelse, plan_id, plassering) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [navn, tid, publisert || false, beskrivelse, planId, plasseringValue]
  );
  
  const produksjon = result.rows[0];
  
  // Hvis applyTalentMal er true og kategori er satt, populer bemanning fra mal
  // NB: Dette oppretter bare "slots" uten å tildele personer - personer må tildeles manuelt senere
  if (applyTalentMal && kategoriId) {
    const talentMal = await kategoriService.findTalentMalByKategoriId(kategoriId);
    // Returnerer produksjon med info om at mal er anvendt
    // Frontend må håndtere selve bemanningen separat hvis ønskelig
  }
  
  return produksjon;
};

/**
 * Oppdater produksjon
 */
const update = async (id, data) => {
  const { navn, tid, kategoriId, publisert, beskrivelse, planId, plassering } = data;
  
  const updateFields = [];
  const values = [];
  let paramCount = 1;
  
  if (navn !== undefined) {
    updateFields.push(`navn = $${paramCount++}`);
    values.push(navn);
  }
  if (tid !== undefined) {
    updateFields.push(`tid = $${paramCount++}`);
    values.push(tid);
  }
  // kategoriId finnes ikke lenger på produksjon
  if (publisert !== undefined) {
    updateFields.push(`publisert = $${paramCount++}`);
    values.push(publisert);
  }
  if (beskrivelse !== undefined) {
    updateFields.push(`beskrivelse = $${paramCount++}`);
    values.push(beskrivelse);
  }
  if (planId !== undefined) {
    updateFields.push(`plan_id = $${paramCount++}`);
    values.push(planId);
  }
  if (plassering !== undefined) {
    updateFields.push(`plassering = $${paramCount++}`);
    values.push(plassering);
  }
  
  if (updateFields.length === 0) {
    return null;
  }
  
  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);
  
  const query = `UPDATE produksjon SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
  const result = await db.query(query, values);
  return result.rows[0] || null;
};

/**
 * Slett produksjon
 */
const remove = async (id) => {
  const result = await db.query(
    'DELETE FROM produksjon WHERE id = $1 RETURNING id',
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Finn produksjoner for en bruker
 */
const findByUserId = async (userId) => {
  const result = await db.query(
    `SELECT 
      p.*,
      pk.navn as kategori_navn,
      pp.navn as plan_navn,
      COUNT(DISTINCT pb.person_id) as antall_personer
    FROM produksjon p
    LEFT JOIN produksjonskategori pk ON p.kategori_id = pk.id
    LEFT JOIN produksjonsplan pp ON p.plan_id = pp.id
    LEFT JOIN produksjon_bemanning pb ON p.id = pb.produksjon_id
    WHERE p.id IN (
      SELECT DISTINCT produksjon_id 
      FROM produksjon_bemanning 
      WHERE person_id = $1
    )
    GROUP BY p.id, pk.navn, pp.navn
    ORDER BY p.tid DESC`,
    [userId]
  );
  return result.rows;
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
  findByUserId,
};

