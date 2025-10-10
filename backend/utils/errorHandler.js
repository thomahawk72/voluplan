/**
 * Wrapper for async route handlers
 * Catches errors and passes them to Express error handler
 * 
 * @param {Function} fn - Async route handler
 * @returns {Function} Wrapped handler
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Standardized error response handler
 * Logs error and sends appropriate response
 * 
 * @param {Error} error - Error object
 * @param {Object} res - Express response object
 * @param {string} context - Context/operation where error occurred
 */
const handleError = (error, res, context) => {
  console.error(`${context} error:`, error);
  res.status(error.status || 500).json({ 
    error: 'Internal server error'
  });
};

module.exports = {
  asyncHandler,
  handleError,
};


