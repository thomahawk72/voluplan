/**
 * Kompetanse Service
 * Håndterer all database-logikk for kompetanser og kategorier
 */

const db = require('../../shared/config/database');

// ============================================================================
// KOMPETANSEKATEGORIER
// ============================================================================

/**
 * Finn alle kompetansekategorier
 */
const findAllKategorier = async () => {
  const result = await db.query(
    'SELECT * FROM kompetansekategori ORDER BY navn'
  );
  return result.rows;
};

/**
 * Finn kompetansekategori basert på ID
 */
const findKategoriById = async (id) => {
  const result = await db.query(
    'SELECT * FROM kompetansekategori WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Opprett ny kompetansekategori
 */
const createKategori = async (data) => {
  const { navn, beskrivelse } = data;
  const result = await db.query(
    'INSERT INTO kompetansekategori (navn, beskrivelse) VALUES ($1, $2) RETURNING *',
    [navn, beskrivelse]
  );
  return result.rows[0];
};

/**
 * Oppdater kompetansekategori
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
  
  const query = `UPDATE kompetansekategori SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
  const result = await db.query(query, values);
  return result.rows[0] || null;
};

/**
 * Slett kompetansekategori
 */
const deleteKategori = async (id) => {
  const result = await db.query(
    'DELETE FROM kompetansekategori WHERE id = $1 RETURNING id',
    [id]
  );
  return result.rows[0] || null;
};

// ============================================================================
// KOMPETANSER
// ============================================================================

/**
 * Finn alle kompetanser
 */
const findAll = async (filters = {}) => {
  let query = `
    SELECT 
      k.*,
      kk.navn as kategori_navn,
      u.first_name as leder_first_name,
      u.last_name as leder_last_name,
      u.email as leder_email
    FROM kompetanse k
    LEFT JOIN kompetansekategori kk ON k.kategori_id = kk.id
    LEFT JOIN users u ON k.leder_id = u.id
  `;
  
  const conditions = [];
  const values = [];
  let paramCount = 1;
  
  if (filters.kategoriId) {
    conditions.push(`k.kategori_id = $${paramCount++}`);
    values.push(filters.kategoriId);
  }
  
  if (filters.lederId) {
    conditions.push(`k.leder_id = $${paramCount++}`);
    values.push(filters.lederId);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' ORDER BY kk.navn, k.navn';
  
  const result = await db.query(query, values);
  return result.rows;
};

/**
 * Finn kompetanse basert på ID
 */
const findById = async (id) => {
  const result = await db.query(
    `SELECT 
      k.*,
      kk.navn as kategori_navn,
      u.first_name as leder_first_name,
      u.last_name as leder_last_name,
      u.email as leder_email
    FROM kompetanse k
    LEFT JOIN kompetansekategori kk ON k.kategori_id = kk.id
    LEFT JOIN users u ON k.leder_id = u.id
    WHERE k.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Opprett ny kompetanse
 */
const create = async (data) => {
  const { navn, kategoriId, lederId, beskrivelse } = data;
  const result = await db.query(
    'INSERT INTO kompetanse (navn, kategori_id, leder_id, beskrivelse) VALUES ($1, $2, $3, $4) RETURNING *',
    [navn, kategoriId, lederId || null, beskrivelse]
  );
  return result.rows[0];
};

/**
 * Oppdater kompetanse
 */
const update = async (id, data) => {
  const { navn, kategoriId, lederId, beskrivelse } = data;
  
  const updateFields = [];
  const values = [];
  let paramCount = 1;
  
  if (navn !== undefined) {
    updateFields.push(`navn = $${paramCount++}`);
    values.push(navn);
  }
  if (kategoriId !== undefined) {
    updateFields.push(`kategori_id = $${paramCount++}`);
    values.push(kategoriId);
  }
  if (lederId !== undefined) {
    updateFields.push(`leder_id = $${paramCount++}`);
    values.push(lederId);
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
  
  const query = `UPDATE kompetanse SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
  const result = await db.query(query, values);
  return result.rows[0] || null;
};

/**
 * Slett kompetanse
 */
const remove = async (id) => {
  const result = await db.query(
    'DELETE FROM kompetanse WHERE id = $1 RETURNING id',
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Finn kompetanser for en bruker
 * (basert på produksjon_bemanning)
 */
const findByUserId = async (userId) => {
  const result = await db.query(
    `SELECT DISTINCT
      k.*,
      kk.navn as kategori_navn
    FROM kompetanse k
    JOIN kompetansekategori kk ON k.kategori_id = kk.id
    JOIN produksjon_bemanning pb ON k.id = pb.kompetanse_id
    WHERE pb.person_id = $1
    ORDER BY kk.navn, k.navn`,
    [userId]
  );
  return result.rows;
};

/**
 * Finn brukere med en spesifikk kompetanse
 * (basert på produksjon_bemanning)
 */
const findUsersByKompetanseId = async (kompetanseId) => {
  const result = await db.query(
    `SELECT DISTINCT
      u.id,
      u.first_name,
      u.last_name,
      u.email,
      COUNT(pb.id) as antall_produksjoner
    FROM users u
    JOIN produksjon_bemanning pb ON u.id = pb.person_id
    WHERE pb.kompetanse_id = $1
    GROUP BY u.id, u.first_name, u.last_name, u.email
    ORDER BY u.last_name, u.first_name`,
    [kompetanseId]
  );
  return result.rows;
};

module.exports = {
  // Kategorier
  findAllKategorier,
  findKategoriById,
  createKategori,
  updateKategori,
  deleteKategori,
  
  // Kompetanser
  findAll,
  findById,
  create,
  update,
  remove,
  findByUserId,
  findUsersByKompetanseId,
};


