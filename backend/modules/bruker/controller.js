/**
 * Bruker Controller
 * Håndterer HTTP-requests og responses for bruker-endepunkter
 */

const service = require('./service');
const jwt = require('jsonwebtoken');
const { mapUserToResponse, mapUsersToResponse } = require('../../shared/utils/userMapper');
const { sendPasswordResetEmail } = require('../../shared/services/emailService');

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  const hours = parseInt(process.env.SESSION_MAX_AGE_HOURS || '8', 10);
  const expiresIn = `${Math.max(1, hours)}h`;
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn,
  });
};

/**
 * POST /api/auth/login
 * Logg inn med e-post og passord
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Finn bruker
    const user = await service.findByEmail(email);
    
    if (!user) {
      return res.status(401).json({ error: 'User not registered in the system' });
    }
    
    // Sjekk om bruker er aktiv
    if (!user.is_active) {
      return res.status(403).json({ error: 'User account is inactive' });
    }
    
    // Sjekk om passord er satt
    if (!user.password_hash) {
      return res.status(401).json({ error: 'Password not set. Please use social login or reset password.' });
    }
    
    // Verifiser passord
    const isValidPassword = await service.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    // Generer token
    const token = generateToken(user.id);
    
    const hours = parseInt(process.env.SESSION_MAX_AGE_HOURS || '8', 10);
    const maxAgeMs = Math.max(1, hours) * 60 * 60 * 1000;

    // Sett cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: maxAgeMs,
    });
    
    // Returner brukerdata og token
    res.json({
      token,
      user: mapUserToResponse(user),
    });
  } catch (error) {
    console.error('[BRUKER] Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/auth/logout
 * Logg ut bruker
 */
const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};

/**
 * GET /api/auth/me
 * Hent innlogget bruker
 */
const me = (req, res) => {
  res.json({
    user: mapUserToResponse(req.user),
  });
};

/**
 * POST /api/auth/forgot-password
 * Be om passordtilbakestilling
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Finn bruker
    const user = await service.findByEmail(email);
    
    // Alltid returner suksess for å unngå e-postenumerasjon
    if (!user) {
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }
    
    // Generer reset token
    const resetToken = await service.createPasswordResetToken(user.id);
    
    // Send e-post
    await sendPasswordResetEmail(user.email, resetToken, user.first_name);
    
    res.json({ message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    console.error('[BRUKER] Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/auth/reset-password
 * Tilbakestill passord med token
 */
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    
    // Finn gyldig token
    const resetToken = await service.findPasswordResetToken(token);
    
    if (!resetToken) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    
    // Hash nytt passord
    const passwordHash = await service.hashPassword(password);
    
    // Oppdater brukerpassord
    await service.updatePassword(resetToken.user_id, passwordHash);
    
    // Marker token som brukt
    await service.markTokenAsUsed(resetToken.id);
    
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('[BRUKER] Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/users
 * Liste alle brukere (kun admin)
 */
const list = async (req, res) => {
  try {
    const users = await service.findAll();
    res.json({
      users: mapUsersToResponse(users),
    });
  } catch (error) {
    console.error('[BRUKER] List users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/users/with-talents
 * Hent brukere med deres talenter (for bemanning)
 * Query params: talentId (optional) - filtrer på spesifikt talent
 */
const listWithTalents = async (req, res) => {
  try {
    const { talentId } = req.query;
    const filters = {};
    
    if (talentId) {
      filters.talentId = parseInt(talentId, 10);
    }
    
    const users = await service.findAllWithTalents(filters);
    res.json({ users });
  } catch (error) {
    console.error('[BRUKER] List users with talents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/users/:id
 * Hent bruker med ID
 */
const get = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Brukere kan kun se sin egen profil med mindre de er admin
    if (req.user.id !== parseInt(id) && !req.user.roles.includes('admin')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    const user = await service.findById(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      user: mapUserToResponse(user),
    });
  } catch (error) {
    console.error('[BRUKER] Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/users
 * Opprett ny bruker (kun admin)
 */
const create = async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, roles = [], talents = [] } = req.body;
    
    // Sjekk om bruker allerede finnes
    const existingUser = await service.findByEmail(email);
    
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    // Opprett bruker
    const user = await service.create({
      firstName,
      lastName,
      email,
      phoneNumber,
      roles,
      talents,
    });
    
    res.status(201).json({
      user: mapUserToResponse(user),
    });
  } catch (error) {
    console.error('[BRUKER] Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PUT /api/users/:id
 * Oppdater bruker
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phoneNumber, currentPassword, roles, talents, isActive } = req.body;
    
    // Brukere kan kun oppdatere sin egen profil (begrensede felter) med mindre de er admin
    const isAdmin = req.user.roles.includes('admin');
    const isOwnProfile = req.user.id === parseInt(id);
    
    if (!isAdmin && !isOwnProfile) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    // Ikke-admin brukere kan kun oppdatere navn, telefon og e-post
    if (!isAdmin && (roles || talents || isActive !== undefined)) {
      return res.status(403).json({ error: 'Only admins can update roles, talents, and active status' });
    }
    
    // E-postendring krever ekstra sikkerhet
    if (email !== undefined) {
      const targetUser = await service.findById(id);
      
      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Hvis bruker endrer sin egen e-post OG har passord, må de bekrefte med passord
      if (isOwnProfile && targetUser.password_hash && !isAdmin) {
        if (!currentPassword) {
          return res.status(400).json({ 
            error: 'Du må bekrefte med nåværende passord for å endre e-post',
            requiresPassword: true 
          });
        }
        
        const isValidPassword = await service.verifyPassword(currentPassword, targetUser.password_hash);
        if (!isValidPassword) {
          return res.status(401).json({ error: 'Feil passord' });
        }
      }
      
      // Admin trenger ikke passord, men vi logger endringen
      if (isAdmin && !isOwnProfile) {
        console.log(`[BRUKER] Admin ${req.user.email} endret e-post for bruker ${id} fra ${targetUser.email} til ${email}`);
      }
      
      // Sjekk om ny e-post allerede er i bruk
      const existingUser = await service.findByEmail(email);
      if (existingUser && existingUser.id !== parseInt(id)) {
        return res.status(400).json({ error: 'E-postadressen er allerede i bruk' });
      }
    }
    
    const updates = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (email !== undefined) updates.email = email;
    if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber;
    if (roles !== undefined && isAdmin) updates.roles = roles;
    if (talents !== undefined && isAdmin) updates.talents = talents;
    if (isActive !== undefined && isAdmin) updates.isActive = isActive;
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    const user = await service.update(id, updates);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      user: mapUserToResponse(user),
    });
  } catch (error) {
    console.error('[BRUKER] Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * DELETE /api/users/:id
 * Slett bruker (kun admin)
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Hindre sletting av seg selv
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    const deletedUser = await service.remove(id);
    
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('[BRUKER] Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * OAuth callback handler
 * Brukes av Google/Facebook OAuth callbacks
 */
const handleOAuthCallback = (req, res) => {
  try {
    const user = req.user;
    const token = generateToken(user.id);
    
    const hours = parseInt(process.env.SESSION_MAX_AGE_HOURS || '8', 10);
    const maxAgeMs = Math.max(1, hours) * 60 * 60 * 1000;

    // Sett cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: maxAgeMs,
    });
    
    // Redirect til frontend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  } catch (error) {
    console.error('[BRUKER] OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
  }
};

/**
 * POST /api/users/bulk-delete
 * Slett flere brukere samtidig
 */
const bulkDelete = async (req, res) => {
  try {
    const { userIds } = req.body;
    
    // Ikke tillat å slette seg selv
    if (userIds.includes(req.user.id)) {
      return res.status(400).json({ error: 'Du kan ikke slette deg selv' });
    }
    
    const deleted = await service.bulkRemove(userIds);
    
    res.json({ 
      message: `${deleted.length} brukere slettet`,
      deletedIds: deleted.map(u => u.id)
    });
  } catch (error) {
    console.error('[BRUKER] Bulk delete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ============================================================================
// BRUKER-TALENT RELASJONER
// ============================================================================

/**
 * GET /api/users/:id/talents
 * Hent alle talents for en bruker
 */
const getUserTalents = async (req, res) => {
  try {
    const { id } = req.params;
    
    const talents = await service.findUserTalents(id);
    
    res.json({ talents });
  } catch (error) {
    console.error('[BRUKER] Get user talents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/users/:id/talents
 * Legg til talent for bruker
 */
const addUserTalent = async (req, res) => {
  try {
    const { id } = req.params;
    const { talentId, erfaringsnivaa, notater } = req.body;
    
    // Sjekk om relasjonen allerede finnes
    const exists = await service.hasUserTalent(id, talentId);
    if (exists) {
      return res.status(400).json({ error: 'Bruker har allerede dette talentet' });
    }
    
    const userTalent = await service.addUserTalent(id, {
      talentId,
      erfaringsnivaa,
      notater,
    });
    
    res.status(201).json({ talent: userTalent });
  } catch (error) {
    console.error('[BRUKER] Add user talent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PUT /api/users/:userId/talents/:talentId
 * Oppdater bruker-talent relasjon
 */
const updateUserTalent = async (req, res) => {
  try {
    const { userId, talentId } = req.params;
    const { erfaringsnivaa, notater } = req.body;
    
    // Finn relasjons-ID
    const talents = await service.findUserTalents(userId);
    const userTalent = talents.find(t => t.talent_id === parseInt(talentId));
    
    if (!userTalent) {
      return res.status(404).json({ error: 'Bruker-talent relasjon ikke funnet' });
    }
    
    const updated = await service.updateUserTalent(userTalent.id, {
      erfaringsnivaa,
      notater,
    });
    
    res.json({ talent: updated });
  } catch (error) {
    console.error('[BRUKER] Update user talent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * DELETE /api/users/:userId/talents/:talentId
 * Fjern talent fra bruker
 */
const removeUserTalent = async (req, res) => {
  try {
    const { userId, talentId } = req.params;
    
    const removed = await service.removeUserTalent(userId, talentId);
    
    if (!removed) {
      return res.status(404).json({ error: 'Bruker-talent relasjon ikke funnet' });
    }
    
    res.json({ message: 'Talent fjernet fra bruker' });
  } catch (error) {
    console.error('[BRUKER] Remove user talent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  generateToken,
  login,
  logout,
  me,
  forgotPassword,
  resetPassword,
  list,
  listWithTalents,
  get,
  create,
  update,
  remove,
  bulkDelete,
  handleOAuthCallback,
  // Bruker-talent
  getUserTalents,
  addUserTalent,
  updateUserTalent,
  removeUserTalent,
};


