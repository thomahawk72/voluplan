/**
 * Bruker Service
 * Håndterer all database-logikk for brukere
 */

const db = require('../../shared/config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * Finn bruker basert på e-post
 */
const findByEmail = async (email) => {
  const result = await db.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
};

/**
 * Finn bruker basert på ID
 */
const findById = async (id) => {
  const result = await db.query(
    'SELECT id, first_name, last_name, email, roles, competence_groups, is_active, created_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Finn alle brukere
 */
const findAll = async () => {
  const result = await db.query(
    'SELECT id, first_name, last_name, email, roles, competence_groups, is_active, created_at FROM users ORDER BY created_at DESC'
  );
  return result.rows;
};

/**
 * Opprett ny bruker
 */
const create = async (userData) => {
  const { firstName, lastName, email, roles = [], competenceGroups = [], passwordHash = null } = userData;
  
  const result = await db.query(
    'INSERT INTO users (first_name, last_name, email, roles, competence_groups, password_hash) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, first_name, last_name, email, roles, competence_groups, is_active, created_at',
    [firstName, lastName, email, roles, competenceGroups, passwordHash]
  );
  
  return result.rows[0];
};

/**
 * Oppdater bruker
 */
const update = async (id, updates) => {
  const { firstName, lastName, roles, competenceGroups, isActive } = updates;
  
  const updateFields = [];
  const values = [];
  let paramCount = 1;
  
  if (firstName !== undefined) {
    updateFields.push(`first_name = $${paramCount++}`);
    values.push(firstName);
  }
  if (lastName !== undefined) {
    updateFields.push(`last_name = $${paramCount++}`);
    values.push(lastName);
  }
  if (roles !== undefined) {
    updateFields.push(`roles = $${paramCount++}`);
    values.push(roles);
  }
  if (competenceGroups !== undefined) {
    updateFields.push(`competence_groups = $${paramCount++}`);
    values.push(competenceGroups);
  }
  if (isActive !== undefined) {
    updateFields.push(`is_active = $${paramCount++}`);
    values.push(isActive);
  }
  
  if (updateFields.length === 0) {
    return null;
  }
  
  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);
  
  const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING id, first_name, last_name, email, roles, competence_groups, is_active, created_at`;
  
  const result = await db.query(query, values);
  return result.rows[0] || null;
};

/**
 * Slett bruker
 */
const remove = async (id) => {
  const result = await db.query(
    'DELETE FROM users WHERE id = $1 RETURNING id',
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Verifiser passord
 */
const verifyPassword = async (password, passwordHash) => {
  return bcrypt.compare(password, passwordHash);
};

/**
 * Hash passord
 */
const hashPassword = async (password) => {
  return bcrypt.hash(password, 10);
};

/**
 * Oppdater passord
 */
const updatePassword = async (userId, newPasswordHash) => {
  await db.query(
    'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [newPasswordHash, userId]
  );
};

/**
 * Opprett password reset token
 */
const createPasswordResetToken = async (userId) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 time
  
  await db.query(
    'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, token, expiresAt]
  );
  
  return token;
};

/**
 * Finn og valider password reset token
 */
const findPasswordResetToken = async (token) => {
  const result = await db.query(
    'SELECT * FROM password_reset_tokens WHERE token = $1 AND used = false AND expires_at > NOW()',
    [token]
  );
  return result.rows[0] || null;
};

/**
 * Marker reset token som brukt
 */
const markTokenAsUsed = async (tokenId) => {
  await db.query(
    'UPDATE password_reset_tokens SET used = true WHERE id = $1',
    [tokenId]
  );
};

/**
 * Opprett eller oppdater OAuth-bruker
 */
const findOrCreateOAuthUser = async (profile, provider) => {
  const email = profile.emails[0].value;
  const providerIdField = provider === 'google' ? 'google_id' : 'facebook_id';
  
  // Sjekk om bruker finnes med OAuth ID
  let result = await db.query(
    `SELECT * FROM users WHERE ${providerIdField} = $1`,
    [profile.id]
  );
  
  if (result.rows.length > 0) {
    return result.rows[0];
  }
  
  // Sjekk om bruker finnes med e-post
  result = await db.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  
  if (result.rows.length > 0) {
    // Oppdater med OAuth ID
    result = await db.query(
      `UPDATE users SET ${providerIdField} = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [profile.id, result.rows[0].id]
    );
    return result.rows[0];
  }
  
  // Opprett ny bruker
  const firstName = profile.name.givenName || profile.displayName.split(' ')[0];
  const lastName = profile.name.familyName || profile.displayName.split(' ').slice(1).join(' ');
  
  result = await db.query(
    `INSERT INTO users (first_name, last_name, email, ${providerIdField}) VALUES ($1, $2, $3, $4) RETURNING *`,
    [firstName, lastName, email, profile.id]
  );
  
  return result.rows[0];
};

module.exports = {
  findByEmail,
  findById,
  findAll,
  create,
  update,
  remove,
  verifyPassword,
  hashPassword,
  updatePassword,
  createPasswordResetToken,
  findPasswordResetToken,
  markTokenAsUsed,
  findOrCreateOAuthUser,
};


