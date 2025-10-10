const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./config/database');

async function testLogin() {
  try {
    const email = 'test@example.com';
    const password = 'passord123';
    
    console.log('Testing login...');
    
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    console.log('User found:', result.rows.length > 0);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('User active:', user.is_active);
      console.log('Has password:', !!user.password_hash);
      
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      console.log('Password valid:', isValidPassword);
      
      if (isValidPassword) {
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        });
        console.log('Token generated:', !!token);
        console.log('Login successful!');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

testLogin();
