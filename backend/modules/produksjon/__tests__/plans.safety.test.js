const request = require('supertest');
const express = require('express');
const routes = require('../routes');
const planService = require('../plan/service');

// Mock plan service
jest.mock('../plan/service');

// Mock auth middleware (bypass)
jest.mock('../../../shared/middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { id: 1, roles: ['admin'] };
    next();
  },
  requireRole: () => (req, res, next) => next(),
}));

const app = express();
app.use(express.json());
app.use('/api/produksjon', routes);

describe('Produksjon API – Planer (sikkerhetsnett før refaktor)', () => {
  afterEach(() => jest.clearAllMocks());

  it('GET /planer skal returnere liste', async () => {
    planService.findAllPlaner.mockResolvedValue([{ id: 1, navn: 'Høst 2025' }]);
    const res = await request(app).get('/api/produksjon/planer').expect(200);
    expect(res.body).toEqual({ planer: [{ id: 1, navn: 'Høst 2025' }] });
  });

  it('GET /planer/:id skal returnere plan eller 404', async () => {
    planService.findPlanById.mockResolvedValue({ id: 2, navn: 'Vår 2026' });
    const ok = await request(app).get('/api/produksjon/planer/2').expect(200);
    expect(ok.body).toEqual({ plan: { id: 2, navn: 'Vår 2026' } });

    planService.findPlanById.mockResolvedValue(null);
    await request(app).get('/api/produksjon/planer/999').expect(404);
  });

  it('POST /planer skal opprette plan', async () => {
    planService.createPlan.mockResolvedValue({ id: 3, navn: 'Sommer 2026' });
    const res = await request(app)
      .post('/api/produksjon/planer')
      .send({ navn: 'Sommer 2026' })
      .expect(201);
    expect(res.body).toEqual({ plan: { id: 3, navn: 'Sommer 2026' } });
  });

  it('PUT /planer/:id skal oppdatere plan eller 404', async () => {
    planService.updatePlan.mockResolvedValue({ id: 1, navn: 'Oppdatert' });
    const ok = await request(app)
      .put('/api/produksjon/planer/1')
      .send({ navn: 'Oppdatert' })
      .expect(200);
    expect(ok.body).toEqual({ plan: { id: 1, navn: 'Oppdatert' } });

    planService.updatePlan.mockResolvedValue(null);
    await request(app).put('/api/produksjon/planer/999').send({ navn: 'X' }).expect(404);
  });

  it('DELETE /planer/:id skal slette eller 404', async () => {
    planService.deletePlan.mockResolvedValue({ id: 10 });
    const ok = await request(app).delete('/api/produksjon/planer/10').expect(200);
    expect(ok.body).toEqual({ message: 'Plan deleted successfully' });

    planService.deletePlan.mockResolvedValue(null);
    await request(app).delete('/api/produksjon/planer/999').expect(404);
  });
});


