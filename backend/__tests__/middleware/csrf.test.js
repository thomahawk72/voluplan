const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');

describe('CSRF Protection', () => {
  let app;
  let csrfToken;

  beforeAll(() => {
    // Create a test app with CSRF protection
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    
    // CSRF middleware
    const csrfProtection = csrf({
      cookie: {
        httpOnly: true,
        sameSite: 'strict',
        secure: false, // test environment
      }
    });
    
    // Endpoint to get CSRF token
    app.get('/api/csrf-token', csrfProtection, (req, res) => {
      res.json({ csrfToken: req.csrfToken() });
    });
    
    // Protected mutation endpoint
    app.post('/api/test-mutation', csrfProtection, (req, res) => {
      res.json({ success: true, message: 'Mutation successful' });
    });
    
    // Unprotected GET endpoint
    app.get('/api/test-read', (req, res) => {
      res.json({ success: true, message: 'Read successful' });
    });
  });

  it('skal tillate å hente CSRF token', async () => {
    const response = await request(app)
      .get('/api/csrf-token');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('csrfToken');
    expect(response.body.csrfToken).toBeTruthy();
    
    // Save token for next tests
    csrfToken = response.body.csrfToken;
  });

  it('skal tillate GET requests uten CSRF token', async () => {
    const response = await request(app)
      .get('/api/test-read');
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('skal blokkere POST uten CSRF token', async () => {
    const response = await request(app)
      .post('/api/test-mutation')
      .send({ data: 'test' });
    
    expect(response.status).toBe(403);
    // CSRF error is returned - specific structure depends on csurf version
    expect(response.status).toBe(403);
  });

  it('skal blokkere POST med ugyldig CSRF token', async () => {
    const response = await request(app)
      .post('/api/test-mutation')
      .set('X-CSRF-Token', 'invalid-token')
      .send({ data: 'test' });
    
    expect(response.status).toBe(403);
  });

  it('skal tillate POST med gyldig CSRF token', async () => {
    // First get token
    const tokenResponse = await request(app)
      .get('/api/csrf-token');
    
    const token = tokenResponse.body.csrfToken;
    const cookies = tokenResponse.headers['set-cookie'];
    
    // Then use token in POST request
    const response = await request(app)
      .post('/api/test-mutation')
      .set('Cookie', cookies)
      .set('X-CSRF-Token', token)
      .send({ data: 'test' });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('skal ha httpOnly cookie for CSRF token', async () => {
    const response = await request(app)
      .get('/api/csrf-token');
    
    const cookies = response.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some(cookie => cookie.includes('HttpOnly'))).toBe(true);
  });

  it('skal ha SameSite=Strict cookie', async () => {
    const response = await request(app)
      .get('/api/csrf-token');
    
    const cookies = response.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some(cookie => cookie.includes('SameSite=Strict'))).toBe(true);
  });
});

