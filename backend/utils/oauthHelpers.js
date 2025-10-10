/**
 * Creates a standardized OAuth callback handler
 * Reduces code duplication across different OAuth providers
 * 
 * @param {Function} generateToken - Function to generate JWT token
 * @returns {Function} Express route handler
 */
const createOAuthCallbackHandler = (generateToken) => {
  return (req, res) => {
    const token = generateToken(req.user.id);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  };
};

module.exports = {
  createOAuthCallbackHandler,
};


