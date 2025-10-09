const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * GET /api/users
 * Get all users (admin only)
 */
router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, first_name, last_name, email, roles, competence_groups, is_active, created_at FROM users ORDER BY created_at DESC'
    );

    res.json({
      users: result.rows.map(user => ({
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        roles: user.roles,
        competenceGroups: user.competence_groups,
        isActive: user.is_active,
        createdAt: user.created_at,
      })),
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/users
 * Create new user (admin only)
 */
router.post(
  '/',
  authenticateToken,
  requireRole(['admin']),
  [
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('roles').optional().isArray(),
    body('competenceGroups').optional().isArray(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { firstName, lastName, email, roles = [], competenceGroups = [] } = req.body;

      // Check if user already exists
      const existingUser = await db.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      // Create user
      const result = await db.query(
        'INSERT INTO users (first_name, last_name, email, roles, competence_groups) VALUES ($1, $2, $3, $4, $5) RETURNING id, first_name, last_name, email, roles, competence_groups, is_active, created_at',
        [firstName, lastName, email, roles, competenceGroups]
      );

      const user = result.rows[0];

      res.status(201).json({
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          roles: user.roles,
          competenceGroups: user.competence_groups,
          isActive: user.is_active,
          createdAt: user.created_at,
        },
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/users/:id
 * Get user by ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Users can only view their own profile unless they are admin
    if (req.user.id !== parseInt(id) && !req.user.roles.includes('admin')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const result = await db.query(
      'SELECT id, first_name, last_name, email, roles, competence_groups, is_active, created_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    res.json({
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        roles: user.roles,
        competenceGroups: user.competence_groups,
        isActive: user.is_active,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/users/:id
 * Update user
 */
router.put(
  '/:id',
  authenticateToken,
  [
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('roles').optional().isArray(),
    body('competenceGroups').optional().isArray(),
    body('isActive').optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { firstName, lastName, roles, competenceGroups, isActive } = req.body;

      // Users can only update their own profile (limited fields) unless they are admin
      const isAdmin = req.user.roles.includes('admin');
      const isOwnProfile = req.user.id === parseInt(id);

      if (!isAdmin && !isOwnProfile) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      // Non-admin users can only update their name
      if (!isAdmin && (roles || competenceGroups || isActive !== undefined)) {
        return res.status(403).json({ error: 'Only admins can update roles, competence groups, and active status' });
      }

      // Build update query
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (firstName) {
        updates.push(`first_name = $${paramCount++}`);
        values.push(firstName);
      }
      if (lastName) {
        updates.push(`last_name = $${paramCount++}`);
        values.push(lastName);
      }
      if (roles && isAdmin) {
        updates.push(`roles = $${paramCount++}`);
        values.push(roles);
      }
      if (competenceGroups && isAdmin) {
        updates.push(`competence_groups = $${paramCount++}`);
        values.push(competenceGroups);
      }
      if (isActive !== undefined && isAdmin) {
        updates.push(`is_active = $${paramCount++}`);
        values.push(isActive);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, first_name, last_name, email, roles, competence_groups, is_active, created_at`;

      const result = await db.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = result.rows[0];

      res.json({
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          roles: user.roles,
          competenceGroups: user.competence_groups,
          isActive: user.is_active,
          createdAt: user.created_at,
        },
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * DELETE /api/users/:id
 * Delete user (admin only)
 */
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

