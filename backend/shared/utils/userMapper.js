/**
 * Maps a database user object to API response format
 * Removes sensitive fields and converts snake_case to camelCase
 * 
 * @param {Object} user - User object from database
 * @returns {Object} User object in API response format
 */
const mapUserToResponse = (user) => {
  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    roles: user.roles || [],
    competenceGroups: user.competence_groups || [],
    isActive: user.is_active,
    createdAt: user.created_at,
  };
};

/**
 * Maps an array of database user objects to API response format
 * 
 * @param {Array} users - Array of user objects from database
 * @returns {Array} Array of user objects in API response format
 */
const mapUsersToResponse = (users) => {
  return users.map(mapUserToResponse);
};

module.exports = {
  mapUserToResponse,
  mapUsersToResponse,
};


