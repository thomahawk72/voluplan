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
    'SELECT id, first_name, last_name, email, phone_number, roles, talents, is_active, created_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Finn alle brukere
 */
const findAll = async () => {
  const result = await db.query(
    'SELECT id, first_name, last_name, email, phone_number, roles, talents, is_active, created_at FROM users ORDER BY created_at DESC'
  );
  return result.rows;
};

/**
 * Opprett ny bruker
 */
const create = async (userData) => {
  const { firstName, lastName, email, phoneNumber = null, roles = [], talents = [], passwordHash = null } = userData;
  
  const result = await db.query(
    'INSERT INTO users (first_name, last_name, email, phone_number, roles, talents, password_hash) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, first_name, last_name, email, phone_number, roles, talents, is_active, created_at',
    [firstName, lastName, email, phoneNumber, roles, talents, passwordHash]
  );
  
  return result.rows[0];
};

/**
 * Oppdater bruker
 */
const update = async (id, updates) => {
  const { firstName, lastName, email, phoneNumber, roles, talents, isActive } = updates;
  
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
  if (email !== undefined) {
    updateFields.push(`email = $${paramCount++}`);
    values.push(email);
  }
  if (phoneNumber !== undefined) {
    updateFields.push(`phone_number = $${paramCount++}`);
    values.push(phoneNumber);
  }
  if (roles !== undefined) {
    updateFields.push(`roles = $${paramCount++}`);
    values.push(roles);
  }
  if (talents !== undefined) {
    updateFields.push(`talents = $${paramCount++}`);
    values.push(talents);
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
  
  const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING id, first_name, last_name, email, phone_number, roles, talents, is_active, created_at`;
  
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

/**
 * Slett flere brukere
 */
const bulkRemove = async (userIds) => {
  const result = await db.query(
    'DELETE FROM users WHERE id = ANY($1) RETURNING id',
    [userIds]
  );
  return result.rows;
};

// ============================================================================
// BRUKER-TALENT RELASJONER
// ============================================================================

/**
 * Finn alle talents for en bruker (fra bruker_talent tabellen)
 */
const findUserTalents = async (userId) => {
  const result = await db.query(
    `SELECT 
      bt.id,
      bt.bruker_id,
      bt.talent_id,
      bt.erfaringsnivaa,
      bt.sertifisert,
      bt.notater,
      bt.created_at,
      t.navn as talent_navn,
      t.kategori_id,
      COALESCE(
        CASE 
          WHEN tk3.parent_id IS NOT NULL AND tk2.parent_id IS NOT NULL THEN 
            tk1.navn || ' → ' || tk2.navn || ' → ' || tk3.navn
          WHEN tk3.parent_id IS NOT NULL THEN 
            tk2.navn || ' → ' || tk3.navn
          ELSE tk3.navn
        END, 
        tk3.navn
      ) as kategori_navn
    FROM bruker_talent bt
    JOIN talent t ON bt.talent_id = t.id
    LEFT JOIN talentkategori tk3 ON t.kategori_id = tk3.id
    LEFT JOIN talentkategori tk2 ON tk3.parent_id = tk2.id
    LEFT JOIN talentkategori tk1 ON tk2.parent_id = tk1.id
    WHERE bt.bruker_id = $1
    ORDER BY kategori_navn, t.navn`,
    [userId]
  );
  return result.rows;
};

/**
 * Legg til talent for bruker
 */
const addUserTalent = async (userId, talentData) => {
  const { talentId, erfaringsnivaa = 'avansert', notater = null } = talentData;
  
  const result = await db.query(
    `INSERT INTO bruker_talent (bruker_id, talent_id, erfaringsnivaa, notater) 
     VALUES ($1, $2, $3, $4) 
     RETURNING *`,
    [userId, talentId, erfaringsnivaa, notater]
  );
  
  return result.rows[0];
};

/**
 * Oppdater bruker-talent relasjon
 */
const updateUserTalent = async (userTalentId, updates) => {
  const { erfaringsnivaa, notater } = updates;
  
  const updateFields = [];
  const values = [];
  let paramCount = 1;
  
  if (erfaringsnivaa !== undefined) {
    updateFields.push(`erfaringsnivaa = $${paramCount++}`);
    values.push(erfaringsnivaa);
  }
  if (notater !== undefined) {
    updateFields.push(`notater = $${paramCount++}`);
    values.push(notater);
  }
  
  if (updateFields.length === 0) {
    return null;
  }
  
  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(userTalentId);
  
  const query = `UPDATE bruker_talent SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
  const result = await db.query(query, values);
  return result.rows[0] || null;
};

/**
 * Fjern talent fra bruker
 */
const removeUserTalent = async (userId, talentId) => {
  const result = await db.query(
    'DELETE FROM bruker_talent WHERE bruker_id = $1 AND talent_id = $2 RETURNING id',
    [userId, talentId]
  );
  return result.rows[0] || null;
};

/**
 * Sjekk om bruker har et spesifikt talent
 */
const hasUserTalent = async (userId, talentId) => {
  const result = await db.query(
    'SELECT id FROM bruker_talent WHERE bruker_id = $1 AND talent_id = $2',
    [userId, talentId]
  );
  return result.rows.length > 0;
};

module.exports = {
  findByEmail,
  findById,
  findAll,
  create,
  update,
  remove,
  bulkRemove,
  verifyPassword,
  hashPassword,
  updatePassword,
  createPasswordResetToken,
  findPasswordResetToken,
  markTokenAsUsed,
  findOrCreateOAuthUser,
  // Bruker-talent relasjoner
  findUserTalents,
  addUserTalent,
  updateUserTalent,
  removeUserTalent,
  hasUserTalent,
};


