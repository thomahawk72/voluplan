const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const db = require('./database');

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user exists with this Google ID
          let result = await db.query(
            'SELECT * FROM users WHERE google_id = $1',
            [profile.id]
          );

          if (result.rows.length > 0) {
            return done(null, result.rows[0]);
          }

          // Check if user exists with this email
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
          
          if (email) {
            result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
            
            if (result.rows.length > 0) {
              // Update existing user with Google ID
              const updateResult = await db.query(
                'UPDATE users SET google_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
                [profile.id, result.rows[0].id]
              );
              return done(null, updateResult.rows[0]);
            }
          }

          // User doesn't exist - OAuth users must be pre-registered
          return done(null, false, { message: 'User not registered in the system' });
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

// Facebook OAuth Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL,
        profileFields: ['id', 'emails', 'name'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user exists with this Facebook ID
          let result = await db.query(
            'SELECT * FROM users WHERE facebook_id = $1',
            [profile.id]
          );

          if (result.rows.length > 0) {
            return done(null, result.rows[0]);
          }

          // Check if user exists with this email
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
          
          if (email) {
            result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
            
            if (result.rows.length > 0) {
              // Update existing user with Facebook ID
              const updateResult = await db.query(
                'UPDATE users SET facebook_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
                [profile.id, result.rows[0].id]
              );
              return done(null, updateResult.rows[0]);
            }
          }

          // User doesn't exist - OAuth users must be pre-registered
          return done(null, false, { message: 'User not registered in the system' });
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

module.exports = passport;

