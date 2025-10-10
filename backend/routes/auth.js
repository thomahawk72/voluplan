const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const passport = require('../config/passport');
const { sendPasswordResetEmail } = require('../services/emailService');
const { authenticateToken } = require('../middleware/auth');
const { createLoginLimiter, createPasswordResetLimiter } = require('../middleware/rateLimiter');
const { mapUserToResponse } = require('../utils/userMapper');
const { createOAuthCallbackHandler } = require('../utils/oauthHelpers');

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post(
  '/login',
  createLoginLimiter(),
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Check if user exists
      const result = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'User not registered in the system' });
      }

      const user = result.rows[0];

      // Check if user is active
      if (!user.is_active) {
        return res.status(403).json({ error: 'User account is inactive' });
      }

      // Check if password is set
      if (!user.password_hash) {
        return res.status(401).json({ error: 'Password not set. Please use social login or reset password.' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid password' });
      }

      // Generate token
      const token = generateToken(user.id);

      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Return user data and token
      res.json({
        token,
        user: mapUserToResponse(user),
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post(
  '/forgot-password',
  createPasswordResetLimiter(),
  [body('email').isEmail().normalizeEmail()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;

      // Check if user exists
      const result = await db.query(
        'SELECT id, first_name, email FROM users WHERE email = $1',
        [email]
      );

      // Always return success to prevent email enumeration
      if (result.rows.length === 0) {
        return res.json({ message: 'If the email exists, a reset link has been sent' });
      }

      const user = result.rows[0];

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Save token to database
      await db.query(
        'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [user.id, resetToken, expiresAt]
      );

      // Send email
      await sendPasswordResetEmail(user.email, resetToken, user.first_name);

      res.json({ message: 'If the email exists, a reset link has been sent' });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post(
  '/reset-password',
  createPasswordResetLimiter(),
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 8 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { token, password } = req.body;

      // Find valid token
      const result = await db.query(
        'SELECT * FROM password_reset_tokens WHERE token = $1 AND used = false AND expires_at > NOW()',
        [token]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid or expired token' });
      }

      const resetToken = result.rows[0];

      // Hash new password
      const passwordHash = await bcrypt.hash(password, 10);

      // Update user password
      await db.query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [passwordHash, resetToken.user_id]
      );

      // Mark token as used
      await db.query(
        'UPDATE password_reset_tokens SET used = true WHERE id = $1',
        [resetToken.id]
      );

      res.json({ message: 'Password reset successful' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/auth/google
 * Initiate Google OAuth
 */
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

/**
 * GET /api/auth/google/callback
 * Google OAuth callback
 */
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  createOAuthCallbackHandler(generateToken)
);

/**
 * GET /api/auth/facebook
 * Initiate Facebook OAuth
 */
router.get(
  '/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
);

/**
 * GET /api/auth/facebook/callback
 * Facebook OAuth callback
 */
router.get(
  '/facebook/callback',
  passport.authenticate('facebook', { session: false, failureRedirect: '/login' }),
  createOAuthCallbackHandler(generateToken)
);

/**
 * GET /api/auth/me
 * Get current user
 */
router.get('/me', authenticateToken, async (req, res) => {
  res.json({
    user: mapUserToResponse(req.user),
  });
});

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;

