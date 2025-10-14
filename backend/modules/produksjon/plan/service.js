/**
 * Plan Service
 * Håndterer database-operasjoner for produksjonsplaner
 */

const db = require('../../../shared/config/database');

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

module.exports = {
  findAllPlaner,
  findPlanById,
  createPlan,
  updatePlan,
  deletePlan,
};

