/**
 * Kompetanse Service
 * Håndterer all database-logikk for kompetanser og kategorier
 */

const db = require('../../shared/config/database');

// ============================================================================
// KOMPETANSEKATEGORIER
// ============================================================================

/**
 * Finn alle talentkategorier (med hierarki - maks 3 nivåer)
 */
const findAllKategorier = async () => {
  const result = await db.query(`
    WITH RECURSIVE category_hierarchy AS (
      -- Root kategorier (parent_id IS NULL)
      SELECT id, navn, parent_id, beskrivelse, created_at, updated_at, 0 as level, navn::text as path
      FROM talentkategori 
      WHERE parent_id IS NULL
      
      UNION ALL
      
      -- Child kategorier
      SELECT tk.id, tk.navn, tk.parent_id, tk.beskrivelse, tk.created_at, tk.updated_at, 
             ch.level + 1, (ch.path || ' → ' || tk.navn)::text as path
      FROM talentkategori tk
      INNER JOIN category_hierarchy ch ON tk.parent_id = ch.id
      WHERE ch.level < 2 -- Maks 3 nivåer (0, 1, 2)
    )
    SELECT * FROM category_hierarchy ORDER BY level, navn
  `);
  return result.rows;
};

/**
 * Finn talentkategori basert på ID
 */
const findKategoriById = async (id) => {
  const result = await db.query(
    'SELECT * FROM talentkategori WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Opprett ny talentkategori
 */
const createKategori = async (data) => {
  const { navn, beskrivelse, parentId } = data;
  const result = await db.query(
    'INSERT INTO talentkategori (navn, beskrivelse, parent_id) VALUES ($1, $2, $3) RETURNING *',
    [navn, beskrivelse, parentId]
  );
  return result.rows[0];
};

/**
 * Oppdater talentkategori
 */
const updateKategori = async (id, data) => {
  const { navn, beskrivelse, parentId } = data;
  
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
  if (parentId !== undefined) {
    updateFields.push(`parent_id = $${paramCount++}`);
    values.push(parentId);
  }
  
  if (updateFields.length === 0) {
    return null;
  }
  
  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);
  
  const query = `UPDATE talentkategori SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
  const result = await db.query(query, values);
  return result.rows[0] || null;
};

/**
 * Slett talentkategori
 */
const deleteKategori = async (id) => {
  const result = await db.query(
    'DELETE FROM talentkategori WHERE id = $1 RETURNING id',
    [id]
  );
  return result.rows[0] || null;
};

// ============================================================================
// KOMPETANSER
// ============================================================================

/**
 * Finn alle talenter (med 3-nivå hierarki)
 */
const findAll = async (filters = {}) => {
  let query = `
    SELECT 
      t.*,
      COALESCE(
        CASE 
          WHEN tk3.parent_id IS NOT NULL AND tk2.parent_id IS NOT NULL THEN 
            tk1.navn || ' → ' || tk2.navn || ' → ' || tk3.navn
          WHEN tk3.parent_id IS NOT NULL THEN 
            tk2.navn || ' → ' || tk3.navn
          ELSE tk3.navn
        END, 
        tk3.navn
      ) as kategori_navn,
      tk3.parent_id as kategori_parent_id,
      u.first_name as leder_first_name,
      u.last_name as leder_last_name,
      u.email as leder_email
    FROM talent t
    LEFT JOIN talentkategori tk3 ON t.kategori_id = tk3.id
    LEFT JOIN talentkategori tk2 ON tk3.parent_id = tk2.id
    LEFT JOIN talentkategori tk1 ON tk2.parent_id = tk1.id
    LEFT JOIN users u ON t.leder_id = u.id
  `;
  
  const conditions = [];
  const values = [];
  let paramCount = 1;
  
  if (filters.kategoriId) {
    conditions.push(`t.kategori_id = $${paramCount++}`);
    values.push(filters.kategoriId);
  }
  
  if (filters.lederId) {
    conditions.push(`t.leder_id = $${paramCount++}`);
    values.push(filters.lederId);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ` ORDER BY 
    COALESCE(tk1.navn, tk2.navn, tk3.navn), 
    COALESCE(tk2.navn, tk3.navn),
    tk3.navn,
    t.navn`;
  
  const result = await db.query(query, values);
  return result.rows;
};

/**
 * Finn talent basert på ID (med 3-nivå hierarki)
 */
const findById = async (id) => {
  const result = await db.query(
    `SELECT 
      t.*,
      COALESCE(
        CASE 
          WHEN tk3.parent_id IS NOT NULL AND tk2.parent_id IS NOT NULL THEN 
            tk1.navn || ' → ' || tk2.navn || ' → ' || tk3.navn
          WHEN tk3.parent_id IS NOT NULL THEN 
            tk2.navn || ' → ' || tk3.navn
          ELSE tk3.navn
        END, 
        tk3.navn
      ) as kategori_navn,
      tk3.parent_id as kategori_parent_id,
      u.first_name as leder_first_name,
      u.last_name as leder_last_name,
      u.email as leder_email
    FROM talent t
    LEFT JOIN talentkategori tk3 ON t.kategori_id = tk3.id
    LEFT JOIN talentkategori tk2 ON tk3.parent_id = tk2.id
    LEFT JOIN talentkategori tk1 ON tk2.parent_id = tk1.id
    LEFT JOIN users u ON t.leder_id = u.id
    WHERE t.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Opprett ny talent
 */
const create = async (data) => {
  const { navn, kategoriId, lederId, beskrivelse } = data;
  const result = await db.query(
    'INSERT INTO talent (navn, kategori_id, leder_id, beskrivelse) VALUES ($1, $2, $3, $4) RETURNING *',
    [navn, kategoriId, lederId || null, beskrivelse]
  );
  return result.rows[0];
};

/**
 * Oppdater talent
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
  
  const query = `UPDATE talent SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
  const result = await db.query(query, values);
  return result.rows[0] || null;
};

/**
 * Slett talent
 */
const remove = async (id) => {
  const result = await db.query(
    'DELETE FROM talent WHERE id = $1 RETURNING id',
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


