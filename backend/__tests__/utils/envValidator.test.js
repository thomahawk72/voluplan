const { validateEnv } = require('../../shared/utils/envValidator');

describe('Environment Validator', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('skal validere at alle required variabler er satt', () => {
    process.env.PORT = '5000';
    process.env.DB_HOST = 'localhost';
    process.env.DB_NAME = 'testdb';
    process.env.DB_USER = 'testuser';
    process.env.DB_PASSWORD = 'testpass';
    process.env.JWT_SECRET = 'testsecret';
    process.env.FRONTEND_URL = 'http://localhost:3000';

    expect(() => validateEnv()).not.toThrow();
  });

  it('skal kaste error hvis PORT mangler', () => {
    delete process.env.PORT;
    process.env.DB_HOST = 'localhost';
    process.env.DB_NAME = 'testdb';
    process.env.DB_USER = 'testuser';
    process.env.DB_PASSWORD = 'testpass';
    process.env.JWT_SECRET = 'testsecret';
    process.env.FRONTEND_URL = 'http://localhost:3000';

    expect(() => validateEnv()).toThrow(/PORT/);
  });

  it('skal kaste error hvis JWT_SECRET mangler', () => {
    process.env.PORT = '5000';
    process.env.DB_HOST = 'localhost';
    process.env.DB_NAME = 'testdb';
    process.env.DB_USER = 'testuser';
    process.env.DB_PASSWORD = 'testpass';
    delete process.env.JWT_SECRET;
    process.env.FRONTEND_URL = 'http://localhost:3000';

    expect(() => validateEnv()).toThrow(/JWT_SECRET/);
  });

  it('skal kaste error hvis database config mangler', () => {
    process.env.PORT = '5000';
    delete process.env.DB_HOST;
    process.env.DB_NAME = 'testdb';
    process.env.DB_USER = 'testuser';
    process.env.DB_PASSWORD = 'testpass';
    process.env.JWT_SECRET = 'testsecret';
    process.env.FRONTEND_URL = 'http://localhost:3000';

    expect(() => validateEnv()).toThrow(/DB_HOST/);
  });

  it('skal liste alle manglende variabler', () => {
    delete process.env.PORT;
    delete process.env.JWT_SECRET;
    delete process.env.DB_HOST;

    try {
      validateEnv();
      fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).toContain('PORT');
      expect(error.message).toContain('JWT_SECRET');
      expect(error.message).toContain('DB_HOST');
    }
  });

  it('skal ikke kreve optional variabler', () => {
    process.env.PORT = '5000';
    process.env.DB_HOST = 'localhost';
    process.env.DB_NAME = 'testdb';
    process.env.DB_USER = 'testuser';
    process.env.DB_PASSWORD = 'testpass';
    process.env.JWT_SECRET = 'testsecret';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.FACEBOOK_APP_ID;

    expect(() => validateEnv()).not.toThrow();
  });
});

