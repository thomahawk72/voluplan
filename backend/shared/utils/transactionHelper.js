/**
 * Helper for sikker transaksjonshåndtering
 * Brukes av alle moduler som trenger multi-step database operasjoner
 */

const pool = require('../config/database');

/**
 * Wrapper for database transaksjoner
 * Håndterer automatisk COMMIT/ROLLBACK
 * 
 * @param {Function} callback - async funksjon som får client som argument
 * @returns {Promise} - resultatet fra callback
 * @throws {Error} - hvis transaksjonen feiler
 * 
 * @example
 * const result = await withTransaction(async (client) => {
 *   await client.query('INSERT INTO...');
 *   await client.query('UPDATE...');
 *   return { success: true };
 * });
 */
async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Helper for single-query operasjoner
 * Reduserer boilerplate kode
 * 
 * @param {string} query - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} - Query result
 */
async function executeQuery(query, params = []) {
  const result = await pool.query(query, params);
  return result;
}

/**
 * Helper for å hente én rad
 * Returnerer undefined hvis ikke funnet
 */
async function queryOne(query, params = []) {
  const result = await pool.query(query, params);
  return result.rows[0];
}

/**
 * Helper for å hente flere rader
 * Returnerer tom array hvis ingen funnet
 */
async function queryMany(query, params = []) {
  const result = await pool.query(query, params);
  return result.rows;
}

module.exports = {
  withTransaction,
  executeQuery,
  queryOne,
  queryMany,
};

