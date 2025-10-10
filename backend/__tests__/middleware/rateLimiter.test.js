const request = require('supertest');
const express = require('express');
const { createLoginLimiter, createPasswordResetLimiter } = require('../../middleware/rateLimiter');

describe('Rate Limiter Middleware', () => {
  describe('Login Rate Limiter', () => {
    let app;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.use('/api/auth/login', createLoginLimiter());
      app.post('/api/auth/login', (req, res) => {
        res.status(200).json({ message: 'Login attempt' });
      });
    });

    it('skal tillate requests innenfor rate limit', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password' });
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login attempt');
    });

    it('skal blokkere requests over rate limit', async () => {
      // Gjør 5 requests (limit)
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({ email: 'test@example.com', password: 'password' });
      }

      // Den 6. skal bli blokkert
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password' });
      
      expect(response.status).toBe(429);
      expect(response.body).toHaveProperty('error');
    });

    it('skal inkludere rate limit headers', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password' });
      
      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
    });
  });

  describe('Password Reset Rate Limiter', () => {
    let app;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.use('/api/auth/forgot-password', createPasswordResetLimiter());
      app.post('/api/auth/forgot-password', (req, res) => {
        res.status(200).json({ message: 'Reset email sent' });
      });
    });

    it('skal tillate requests innenfor rate limit', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });
      
      expect(response.status).toBe(200);
    });

    it('skal blokkere requests over rate limit', async () => {
      // Gjør 3 requests (limit for password reset)
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/auth/forgot-password')
          .send({ email: 'test@example.com' });
      }

      // Den 4. skal bli blokkert
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });
      
      expect(response.status).toBe(429);
    });
  });
});


