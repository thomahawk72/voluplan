/**
 * Validates that all required environment variables are set
 * Throws error with list of missing variables if validation fails
 */
const validateEnv = () => {
  // On Heroku, DATABASE_URL is provided instead of individual DB vars
  const hasHerokuDatabase = !!process.env.DATABASE_URL;
  
  const required = [
    'PORT',
    'JWT_SECRET',
    'FRONTEND_URL',
  ];
  
  // Only require individual DB vars if DATABASE_URL is not set
  if (!hasHerokuDatabase) {
    required.push('DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD');
  }

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.\n' +
      'See .env.example for reference.'
    );
  }
  
  if (hasHerokuDatabase) {
    console.log('✅ Using Heroku DATABASE_URL');
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


