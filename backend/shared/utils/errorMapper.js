/**
 * Database error mapping til brukervennlige feilmeldinger
 * Eliminerer duplikat error-handling på tvers av alle controllers
 */

const { ERROR_MESSAGES } = require('./queryFragments');

/**
 * Mapper PostgreSQL error codes til HTTP status codes
 */
const ERROR_STATUS_MAP = {
  '23505': 409, // Unique violation → Conflict
  '23503': 400, // Foreign key violation → Bad Request
  '23502': 400, // Not null violation → Bad Request
  '42P01': 500, // Undefined table → Internal Server Error
  '42703': 500, // Undefined column → Internal Server Error
  '22P02': 400, // Invalid text representation → Bad Request
};

/**
 * Mapper database errors til standardiserte response objekter
 * 
 * @param {Error} error - Database error object
 * @returns {Object} - { status, error, details }
 * 
 * @example
 * try {
 *   await pool.query(...)
 * } catch (error) {
 *   const { status, error: message, details } = mapDatabaseError(error);
 *   return res.status(status).json({ error: message, details });
 * }
 */
function mapDatabaseError(error) {
  const code = error.code;
  const status = ERROR_STATUS_MAP[code] || 500;
  const message = ERROR_MESSAGES[code] || 'Database error';
  
  // Log full error for debugging
  console.error('[DB ERROR]', {
    code,
    message: error.message,
    detail: error.detail,
    table: error.table,
    constraint: error.constraint,
  });

  // Return user-friendly response
  return {
    status,
    error: message,
    details: process.env.NODE_ENV === 'development' ? {
      code,
      detail: error.detail,
      constraint: error.constraint,
    } : undefined,
  };
}

/**
 * Express middleware for å håndtere database errors
 * Brukes som siste error handler i route chains
 * 
 * @example
 * router.post('/users', async (req, res, next) => {
 *   try {
 *     // ... database operations
 *   } catch (error) {
 *     next(error);
 *   }
 * }, handleDatabaseError);
 */
function handleDatabaseError(error, req, res, next) {
  if (error.code) {
    // PostgreSQL error
    const { status, error: message, details } = mapDatabaseError(error);
    return res.status(status).json({ error: message, details });
  }
  
  // Pass to next error handler
  next(error);
}

/**
 * Wrapper for service functions med automatisk error mapping
 * 
 * @param {Function} serviceFn - Service function
 * @returns {Function} - Express middleware
 * 
 * @example
 * router.get('/users/:id', withErrorMapping(async (req, res) => {
 *   const user = await userService.findById(req.params.id);
 *   res.json(user);
 * }));
 */
function withErrorMapping(serviceFn) {
  return async (req, res, next) => {
    try {
      await serviceFn(req, res, next);
    } catch (error) {
      if (error.code) {
        const { status, error: message, details } = mapDatabaseError(error);
        return res.status(status).json({ error: message, details });
      }
      next(error);
    }
  };
}

module.exports = {
  mapDatabaseError,
  handleDatabaseError,
  withErrorMapping,
  ERROR_STATUS_MAP,
};

