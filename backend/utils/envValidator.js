/**
 * Validates that all required environment variables are set
 * Throws error with list of missing variables if validation fails
 */
const validateEnv = () => {
  const required = [
    'PORT',
    'DB_HOST',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'JWT_SECRET',
    'FRONTEND_URL',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.\n' +
      'See .env.example for reference.'
    );
  }

  // Warn about optional OAuth variables if not set
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('⚠️  Google OAuth not configured. Google login will be disabled.');
  }

  if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
    console.warn('⚠️  Facebook OAuth not configured. Facebook login will be disabled.');
  }

  console.log('✅ Environment variables validated successfully');
};

module.exports = {
  validateEnv,
};


