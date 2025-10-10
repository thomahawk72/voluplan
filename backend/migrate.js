#!/usr/bin/env node
/**
 * Database Migration Script
 * Kjører alle SQL-filer i riktig rekkefølge
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Bruk DATABASE_URL fra Heroku eller lokal config
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

async function runMigrations() {
  console.log('🚀 Starting database migrations...\n');
  
  try {
    // Les schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📋 Running schema.sql...');
    await pool.query(schema);
    console.log('✅ Schema created successfully!\n');
    
    // Sjekk om det finnes brukere
    const userCheck = await pool.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(userCheck.rows[0].count);
    
    if (userCount === 0) {
      console.log('👤 Creating admin user...');
      // Passord: passord123
      const passwordHash = '$2b$10$p6ZwvIQu/GSxmzbcQyLcbO7BjMbSPFv3yUlf6ehH2ZrZGXAZfsidm';
      
      await pool.query(`
        INSERT INTO users (first_name, last_name, email, password_hash, roles, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, ['Admin', 'User', 'admin@voluplan.com', passwordHash, ['admin'], true]);
      
      console.log('✅ Admin user created!');
      console.log('   Email: admin@voluplan.com');
      console.log('   Password: passord123');
      console.log('   ⚠️  Change password after first login!\n');
    } else {
      console.log(`ℹ️  Found ${userCount} existing user(s), skipping user creation\n`);
    }
    
    console.log('✅ All migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();

