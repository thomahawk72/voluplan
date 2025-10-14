/**
 * Bemanning Service
 * Håndterer database-operasjoner for bemanning (medarbeidere i produksjoner)
 */

const db = require('../../../shared/config/database');

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
    FROM produksjon_bemanning pb
    JOIN users u ON pb.person_id = u.id
    JOIN talent t ON pb.talent_id = t.id
    LEFT JOIN talentkategori tk3 ON t.kategori_id = tk3.id
    LEFT JOIN talentkategori tk2 ON tk3.parent_id = tk2.id
    LEFT JOIN talentkategori tk1 ON tk2.parent_id = tk1.id
    WHERE pb.produksjon_id = $1
    ORDER BY 
      COALESCE(tk1.navn, tk2.navn, tk3.navn), 
      COALESCE(tk2.navn, tk3.navn),
      tk3.navn,
      t.navn, 
      u.last_name, 
      u.first_name`,
    [produksjonId]
  );
  return result.rows;
};

/**
 * Legg til person i produksjon
 */
const addBemanning = async (data) => {
  const { produksjonId, personId, talentId, notater, status } = data;
  const result = await db.query(
    'INSERT INTO produksjon_bemanning (produksjon_id, person_id, talent_id, notater, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [produksjonId, personId, talentId, notater, status || 'planlagt']
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
  findBemanningByProduksjonId,
  addBemanning,
  updateBemanning,
  removeBemanning,
};

