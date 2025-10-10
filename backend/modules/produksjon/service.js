/**
 * Produksjon Service
 * Håndterer all database-logikk for produksjoner, planer, kategorier og bemanning
 */

const db = require('../../shared/config/database');

// ============================================================================
// PRODUKSJONSPLANER
// ============================================================================

/**
 * Finn alle produksjonsplaner
 */
const findAllPlaner = async () => {
  const result = await db.query(
    'SELECT * FROM produksjonsplan ORDER BY start_dato DESC'
  );
  return result.rows;
};

/**
 * Finn produksjonsplan basert på ID
 */
const findPlanById = async (id) => {
  const result = await db.query(
    'SELECT * FROM produksjonsplan WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Opprett ny produksjonsplan
 */
const createPlan = async (data) => {
  const { navn, beskrivelse, startDato, sluttDato } = data;
  const result = await db.query(
    'INSERT INTO produksjonsplan (navn, beskrivelse, start_dato, slutt_dato) VALUES ($1, $2, $3, $4) RETURNING *',
    [navn, beskrivelse, startDato, sluttDato]
  );
  return result.rows[0];
};

/**
 * Oppdater produksjonsplan
 */
const updatePlan = async (id, data) => {
  const { navn, beskrivelse, startDato, sluttDato } = data;
  
  const updateFields = [];
  const values = [];
  let paramCount = 1;
  
  if (navn !== undefined) {
    updateFields.push(`navn = $${paramCount++}`);
    values.push(navn);
  }
  if (beskrivelse !== undefined) {
    updateFields.push(`beskrivelse = $${paramCount++}`);
    values.push(beskrivelse);
  }
  if (startDato !== undefined) {
    updateFields.push(`start_dato = $${paramCount++}`);
    values.push(startDato);
  }
  if (sluttDato !== undefined) {
    updateFields.push(`slutt_dato = $${paramCount++}`);
    values.push(sluttDato);
  }
  
  if (updateFields.length === 0) {
    return null;
  }
  
  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);
  
  const query = `UPDATE produksjonsplan SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
  const result = await db.query(query, values);
  return result.rows[0] || null;
};

/**
 * Slett produksjonsplan
 */
const deletePlan = async (id) => {
  const result = await db.query(
    'DELETE FROM produksjonsplan WHERE id = $1 RETURNING id',
    [id]
  );
  return result.rows[0] || null;
};

// ============================================================================
// PRODUKSJONSKATEGORIER
// ============================================================================

/**
 * Finn alle produksjonskategorier
 */
const findAllKategorier = async () => {
  const result = await db.query(
    'SELECT * FROM produksjonskategori ORDER BY navn'
  );
  return result.rows;
};

/**
 * Finn produksjonskategori basert på ID
 */
const findKategoriById = async (id) => {
  const result = await db.query(
    'SELECT * FROM produksjonskategori WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Opprett ny produksjonskategori
 */
const createKategori = async (data) => {
  const { navn, beskrivelse } = data;
  const result = await db.query(
    'INSERT INTO produksjonskategori (navn, beskrivelse) VALUES ($1, $2) RETURNING *',
    [navn, beskrivelse]
  );
  return result.rows[0];
};

/**
 * Oppdater produksjonskategori
 */
const updateKategori = async (id, data) => {
  const { navn, beskrivelse } = data;
  
  const updateFields = [];
  const values = [];
  let paramCount = 1;
  
  if (navn !== undefined) {
    updateFields.push(`navn = $${paramCount++}`);
    values.push(navn);
  }
  if (beskrivelse !== undefined) {
    updateFields.push(`beskrivelse = $${paramCount++}`);
    values.push(beskrivelse);
  }
  
  if (updateFields.length === 0) {
    return null;
  }
  
  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);
  
  const query = `UPDATE produksjonskategori SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
  const result = await db.query(query, values);
  return result.rows[0] || null;
};

/**
 * Slett produksjonskategori
 */
const deleteKategori = async (id) => {
  const result = await db.query(
    'DELETE FROM produksjonskategori WHERE id = $1 RETURNING id',
    [id]
  );
  return result.rows[0] || null;
};

// ============================================================================
// PRODUKSJONER
// ============================================================================

/**
 * Finn alle produksjoner
 */
const findAll = async (filters = {}) => {
  let query = `
    SELECT 
      p.*,
      pk.navn as kategori_navn,
      pp.navn as plan_navn,
      COUNT(DISTINCT pb.person_id) as antall_personer
    FROM produksjon p
    LEFT JOIN produksjonskategori pk ON p.kategori_id = pk.id
    LEFT JOIN produksjonsplan pp ON p.plan_id = pp.id
    LEFT JOIN produksjon_bemanning pb ON p.id = pb.produksjon_id
  `;
  
  const conditions = [];
  const values = [];
  let paramCount = 1;
  
  if (filters.kategoriId) {
    conditions.push(`p.kategori_id = $${paramCount++}`);
    values.push(filters.kategoriId);
  }
  
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
  
  query += ' GROUP BY p.id, pk.navn, pp.navn ORDER BY p.tid DESC';
  
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
      pk.navn as kategori_navn,
      pp.navn as plan_navn,
      COUNT(DISTINCT pb.person_id) as antall_personer
    FROM produksjon p
    LEFT JOIN produksjonskategori pk ON p.kategori_id = pk.id
    LEFT JOIN produksjonsplan pp ON p.plan_id = pp.id
    LEFT JOIN produksjon_bemanning pb ON p.id = pb.produksjon_id
    WHERE p.id = $1
    GROUP BY p.id, pk.navn, pp.navn`,
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Opprett ny produksjon
 */
const create = async (data) => {
  const { navn, tid, kategoriId, publisert, beskrivelse, planId } = data;
  const result = await db.query(
    'INSERT INTO produksjon (navn, tid, kategori_id, publisert, beskrivelse, plan_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [navn, tid, kategoriId, publisert || false, beskrivelse, planId]
  );
  return result.rows[0];
};

/**
 * Oppdater produksjon
 */
const update = async (id, data) => {
  const { navn, tid, kategoriId, publisert, beskrivelse, planId } = data;
  
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
  if (kategoriId !== undefined) {
    updateFields.push(`kategori_id = $${paramCount++}`);
    values.push(kategoriId);
  }
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

// ============================================================================
// BEMANNING
// ============================================================================

/**
 * Finn bemanning for en produksjon
 */
const findBemanningByProduksjonId = async (produksjonId) => {
  const result = await db.query(
    `SELECT 
      pb.*,
      u.first_name,
      u.last_name,
      u.email,
      k.navn as kompetanse_navn,
      kk.navn as kompetanse_kategori
    FROM produksjon_bemanning pb
    JOIN users u ON pb.person_id = u.id
    JOIN kompetanse k ON pb.kompetanse_id = k.id
    JOIN kompetansekategori kk ON k.kategori_id = kk.id
    WHERE pb.produksjon_id = $1
    ORDER BY kk.navn, k.navn, u.last_name, u.first_name`,
    [produksjonId]
  );
  return result.rows;
};

/**
 * Legg til person i produksjon
 */
const addBemanning = async (data) => {
  const { produksjonId, personId, kompetanseId, notater, status } = data;
  const result = await db.query(
    'INSERT INTO produksjon_bemanning (produksjon_id, person_id, kompetanse_id, notater, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [produksjonId, personId, kompetanseId, notater, status || 'planlagt']
  );
  return result.rows[0];
};

/**
 * Oppdater bemanning
 */
const updateBemanning = async (id, data) => {
  const { notater, status } = data;
  
  const updateFields = [];
  const values = [];
  let paramCount = 1;
  
  if (notater !== undefined) {
    updateFields.push(`notater = $${paramCount++}`);
    values.push(notater);
  }
  if (status !== undefined) {
    updateFields.push(`status = $${paramCount++}`);
    values.push(status);
  }
  
  if (updateFields.length === 0) {
    return null;
  }
  
  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);
  
  const query = `UPDATE produksjon_bemanning SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
  const result = await db.query(query, values);
  return result.rows[0] || null;
};

/**
 * Fjern person fra produksjon
 */
const removeBemanning = async (id) => {
  const result = await db.query(
    'DELETE FROM produksjon_bemanning WHERE id = $1 RETURNING id',
    [id]
  );
  return result.rows[0] || null;
};

module.exports = {
  // Planer
  findAllPlaner,
  findPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  
  // Kategorier
  findAllKategorier,
  findKategoriById,
  createKategori,
  updateKategori,
  deleteKategori,
  
  // Produksjoner
  findAll,
  findById,
  create,
  update,
  remove,
  findByUserId,
  
  // Bemanning
  findBemanningByProduksjonId,
  addBemanning,
  updateBemanning,
  removeBemanning,
};


