/**
 * Kategori Service
 * Håndterer database-operasjoner for produksjonskategorier og talent-maler
 */

const db = require('../../../shared/config/database');

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
  const { navn, beskrivelse, plassering } = data;
  const result = await db.query(
    'INSERT INTO produksjonskategori (navn, beskrivelse, plassering) VALUES ($1, $2, $3) RETURNING *',
    [navn, beskrivelse, plassering]
  );
  return result.rows[0];
};

/**
 * Oppdater produksjonskategori
 */
const updateKategori = async (id, data) => {
  const { navn, beskrivelse, plassering } = data;
  
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
  if (plassering !== undefined) {
    updateFields.push(`plassering = $${paramCount++}`);
    values.push(plassering);
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

/**
 * Slett produksjonskategori og all tilhørende data (maler) i en transaksjon
 */
const deleteKategoriDeep = async (id) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    // Slett maler eksplisitt for robusthet også der FK CASCADE ikke er oppdatert
    await client.query('DELETE FROM produksjonskategori_talent_mal WHERE kategori_id = $1', [id]);
    const del = await client.query('DELETE FROM produksjonskategori WHERE id = $1 RETURNING id', [id]);
    await client.query('COMMIT');
    return del.rows[0] || null;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// ============================================================================
// KATEGORI TALENT-MAL
// ============================================================================

/**
 * Hent talent-mal for en produksjonskategori
 */
const findTalentMalByKategoriId = async (kategoriId) => {
  const result = await db.query(
    `SELECT 
      pktm.*,
      t.navn as talent_navn,
      COALESCE(
        CASE 
          WHEN tk3.parent_id IS NOT NULL AND tk2.parent_id IS NOT NULL THEN 
            tk1.navn || ' → ' || tk2.navn || ' → ' || tk3.navn
          WHEN tk3.parent_id IS NOT NULL THEN 
            tk2.navn || ' → ' || tk3.navn
          ELSE tk3.navn
        END, 
        tk3.navn
      ) as talent_kategori
    FROM produksjonskategori_talent_mal pktm
    JOIN talent t ON pktm.talent_id = t.id
    LEFT JOIN talentkategori tk3 ON t.kategori_id = tk3.id
    LEFT JOIN talentkategori tk2 ON tk3.parent_id = tk2.id
    LEFT JOIN talentkategori tk1 ON tk2.parent_id = tk1.id
    WHERE pktm.kategori_id = $1
    ORDER BY 
      COALESCE(tk1.navn, tk2.navn, tk3.navn),
      COALESCE(tk2.navn, tk3.navn),
      tk3.navn,
      t.navn`,
    [kategoriId]
  );
  return result.rows;
};

/**
 * Legg til talent i kategori-mal
 */
const addTalentToKategoriMal = async (data) => {
  const { kategoriId, talentId, antall, beskrivelse } = data;
  const result = await db.query(
    'INSERT INTO produksjonskategori_talent_mal (kategori_id, talent_id, antall, beskrivelse) VALUES ($1, $2, $3, $4) RETURNING *',
    [kategoriId, talentId, antall || 1, beskrivelse]
  );
  return result.rows[0];
};

/**
 * Oppdater talent i kategori-mal
 */
const updateTalentInKategoriMal = async (id, data) => {
  const { antall, beskrivelse } = data;
  
  const updateFields = [];
  const values = [];
  let paramCount = 1;
  
  if (antall !== undefined) {
    updateFields.push(`antall = $${paramCount++}`);
    values.push(antall);
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
  
  const query = `UPDATE produksjonskategori_talent_mal SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
  const result = await db.query(query, values);
  return result.rows[0] || null;
};

/**
 * Fjern talent fra kategori-mal
 */
const removeTalentFromKategoriMal = async (id) => {
  const result = await db.query(
    'DELETE FROM produksjonskategori_talent_mal WHERE id = $1 RETURNING id',
    [id]
  );
  return result.rows[0] || null;
};

// ============================================================================
// KATEGORI PLAN-MAL
// ============================================================================

/**
 * Hent plan-mal for en produksjonskategori
 */
const findPlanMalByKategoriId = async (kategoriId) => {
  const result = await db.query(
    `SELECT 
      id,
      kategori_id,
      type,
      navn,
      varighet_minutter,
      parent_id,
      rekkefølge
    FROM produksjonskategori_plan_mal_element
    WHERE kategori_id = $1
    ORDER BY 
      COALESCE(parent_id, id),
      parent_id NULLS FIRST,
      rekkefølge,
      id`,
    [kategoriId]
  );
  return result.rows;
};

/**
 * Legg til element i plan-mal (overskrift eller hendelse)
 */
const addPlanMalElement = async (data) => {
  const { kategoriId, type, navn, varighetMinutter, parentId, rekkefølge } = data;
  const result = await db.query(
    `INSERT INTO produksjonskategori_plan_mal_element 
      (kategori_id, type, navn, varighet_minutter, parent_id, rekkefølge) 
    VALUES ($1, $2, $3, $4, $5, $6) 
    RETURNING *`,
    [kategoriId, type, navn, varighetMinutter || null, parentId || null, rekkefølge || 0]
  );
  return result.rows[0];
};

/**
 * Oppdater element i plan-mal
 */
const updatePlanMalElement = async (id, data) => {
  const { navn, varighetMinutter, rekkefølge } = data;
  
  const updateFields = [];
  const values = [];
  let paramCount = 1;
  
  if (navn !== undefined) {
    updateFields.push(`navn = $${paramCount++}`);
    values.push(navn);
  }
  if (varighetMinutter !== undefined) {
    updateFields.push(`varighet_minutter = $${paramCount++}`);
    values.push(varighetMinutter);
  }
  if (rekkefølge !== undefined) {
    updateFields.push(`rekkefølge = $${paramCount++}`);
    values.push(rekkefølge);
  }
  
  if (updateFields.length === 0) {
    return null;
  }
  
  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);
  
  const query = `UPDATE produksjonskategori_plan_mal_element SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
  const result = await db.query(query, values);
  return result.rows[0] || null;
};

/**
 * Oppdater kun rekkefølge på et element
 */
const updatePlanMalRekkefølge = async (id, rekkefølge) => {
  const result = await db.query(
    'UPDATE produksjonskategori_plan_mal_element SET rekkefølge = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
    [rekkefølge, id]
  );
  return result.rows[0] || null;
};

/**
 * Fjern element fra plan-mal (CASCADE sletter barn automatisk)
 */
const removePlanMalElement = async (id) => {
  const result = await db.query(
    'DELETE FROM produksjonskategori_plan_mal_element WHERE id = $1 RETURNING id',
    [id]
  );
  return result.rows[0] || null;
};

module.exports = {
  // Kategorier
  findAllKategorier,
  findKategoriById,
  createKategori,
  updateKategori,
  deleteKategori,
  deleteKategoriDeep,
  
  // Kategori talent-mal
  findTalentMalByKategoriId,
  addTalentToKategoriMal,
  updateTalentInKategoriMal,
  removeTalentFromKategoriMal,
  
  // Kategori plan-mal
  findPlanMalByKategoriId,
  addPlanMalElement,
  updatePlanMalElement,
  updatePlanMalRekkefølge,
  removePlanMalElement,
};

