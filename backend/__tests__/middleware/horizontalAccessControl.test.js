/**
 * Horizontal Access Control Tests
 * Tests for checkResourceOwnership middleware
 */

const { checkResourceOwnership } = require('../../shared/middleware/auth');

describe('Horizontal Access Control Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: {},
      user: null,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    // Suppress console.warn for tests
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    console.warn.mockRestore();
  });

  describe('checkResourceOwnership()', () => {
    it('should return 401 if user is not authenticated', () => {
      const middleware = checkResourceOwnership('id', 'user');
      
      req.params.id = '5';
      // req.user is null
      
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow admin to access any resource', () => {
      const middleware = checkResourceOwnership('id', 'user');
      
      req.params.id = '5';
      req.user = {
        id: 1,
        roles: ['admin'],
      };
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow user to access their own resource', () => {
      const middleware = checkResourceOwnership('id', 'user');
      
      req.params.id = '5';
      req.user = {
        id: 5,
        roles: ['user'],
      };
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny user access to another user\'s resource', () => {
      const middleware = checkResourceOwnership('id', 'user');
      
      req.params.id = '10';
      req.user = {
        id: 5,
        roles: ['user'],
      };
      
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions',
        message: 'You can only access your own data',
      });
      expect(next).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith('[ACCESS DENIED] User 5 attempted to access user 10');
    });

    it('should work with custom param name (userId)', () => {
      const middleware = checkResourceOwnership('userId', 'user');
      
      req.params.userId = '7';
      req.user = {
        id: 7,
        roles: [],
      };
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access with custom param name when IDs don\'t match', () => {
      const middleware = checkResourceOwnership('userId', 'production');
      
      req.params.userId = '20';
      req.user = {
        id: 5,
        roles: [],
      };
      
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith('[ACCESS DENIED] User 5 attempted to access production 20');
    });

    it('should handle user with no roles array', () => {
      const middleware = checkResourceOwnership('id', 'user');
      
      req.params.id = '5';
      req.user = {
        id: 5,
        // No roles property
      };
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should parse string ID to integer for comparison', () => {
      const middleware = checkResourceOwnership('id', 'user');
      
      req.params.id = '5'; // String from URL
      req.user = {
        id: 5, // Integer from database
        roles: ['user'],
      };
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny when admin role is in array with other roles', () => {
      const middleware = checkResourceOwnership('id', 'user');
      
      req.params.id = '10';
      req.user = {
        id: 1,
        roles: ['user', 'admin', 'moderator'],
      };
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled(); // Should pass because admin role is present
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});

