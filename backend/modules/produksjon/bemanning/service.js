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
      pb.id,
      pb.produksjon_id,
      pb.person_id,
      pb.talent_navn,
      pb.talent_kategori_sti as talent_kategori,
      pb.notater,
      pb.status,
      pb.created_at,
      pb.updated_at,
      u.first_name,
      u.last_name,
      u.email
    FROM produksjon_bemanning pb
    JOIN users u ON pb.person_id = u.id
    WHERE pb.produksjon_id = $1
    ORDER BY 
      pb.talent_kategori_sti,
      pb.talent_navn, 
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
  const { produksjonId, personId, talentNavn, talentKategoriSti, notater, status } = data;
  const result = await db.query(
    'INSERT INTO produksjon_bemanning (produksjon_id, person_id, talent_navn, talent_kategori_sti, notater, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [produksjonId, personId, talentNavn, talentKategoriSti, notater, status || 'planlagt']
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

