const request = require('supertest');
const express = require('express');
const routes = require('../routes');
const bemanningService = require('../bemanning/service');
const produksjonService = require('../produksjon/service');

// Mock bemanning service
jest.mock('../bemanning/service');
jest.mock('../produksjon/service');

// Mock auth middleware
jest.mock('../../../shared/middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { id: 1, roles: ['admin'] };
    next();
  },
  requireRole: (roles) => (req, res, next) => next(),
}));

const app = express();
app.use(express.json());
app.use('/api/produksjon', routes);

describe('Produksjon API - Bemanning Endpoints', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/produksjon/:id/bemanning', () => {
    it('skal returnere bemanning med talent-felter', async () => {
      const mockBemanning = [
        {
          id: 1,
          produksjon_id: 1,
          person_id: 1,
          talent_id: 1,
          notater: 'Test notater',
          status: 'bekreftet',
          first_name: 'Test',
          last_name: 'Bruker',
          email: 'test@example.com',
          talent_navn: 'FOH Lyd',
          talent_kategori: 'Lyd'
        },
        {
          id: 2,
          produksjon_id: 1,
          person_id: 2,
          talent_id: 2,
          notater: null,
          status: 'planlagt',
          first_name: 'Anne',
          last_name: 'Hansen',
          email: 'anne@example.com',
          talent_navn: 'Lysbord operatør',
          talent_kategori: 'Lys'
        }
      ];

      const mockTalentBehov = [
        {
          id: 1,
          produksjon_id: 1,
          talent_id: 1,
          talent_navn: 'FOH Lyd',
          talent_kategori: 'Lyd',
          antall: 2,
        }
      ];

      bemanningService.findBemanningByProduksjonId.mockResolvedValue(mockBemanning);
      produksjonService.findTalentBehovByProduksjonId.mockResolvedValue(mockTalentBehov);

      const response = await request(app)
        .get('/api/produksjon/1/bemanning')
        .expect(200);

      expect(response.body).toEqual({ bemanning: mockBemanning, talentBehov: mockTalentBehov });
      expect(response.body.bemanning[0]).toHaveProperty('talent_navn');
      expect(response.body.bemanning[0]).toHaveProperty('talent_kategori');
      expect(response.body.bemanning[0]).not.toHaveProperty('kompetanse_navn');
      expect(response.body.bemanning[0]).not.toHaveProperty('kompetanse_kategori');
    });

    it('skal returnere tomt array hvis ingen bemanning', async () => {
      bemanningService.findBemanningByProduksjonId.mockResolvedValue([]);
      produksjonService.findTalentBehovByProduksjonId.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/produksjon/1/bemanning')
        .expect(200);

      expect(response.body).toEqual({ bemanning: [], talentBehov: [] });
    });

    it('skal returnere 500 ved database-feil', async () => {
      bemanningService.findBemanningByProduksjonId.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/produksjon/1/bemanning')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/produksjon/:id/bemanning', () => {
    it('skal legge til bemanning med talentId', async () => {
      const mockBemanning = {
        id: 1,
        produksjon_id: 1,
        person_id: 1,
        talent_id: 1,
        notater: 'Test notater',
        status: 'planlagt'
      };

      bemanningService.addBemanning.mockResolvedValue(mockBemanning);

      const response = await request(app)
        .post('/api/produksjon/1/bemanning')
        .send({
          personId: 1,
          talentId: 1,
          notater: 'Test notater',
          status: 'planlagt'
        })
        .expect(201);

      expect(response.body).toEqual({ bemanning: mockBemanning });
      expect(bemanningService.addBemanning).toHaveBeenCalledWith({
        produksjonId: '1',
        personId: 1,
        talentId: 1,
        notater: 'Test notater',
        status: 'planlagt'
      });
    });

    it('skal IKKE akseptere kompetanseId (gammelt felt)', async () => {
      const mockBemanning = {
        id: 1,
        produksjon_id: 1,
        person_id: 1,
        talent_id: 1,
        status: 'planlagt'
      };

      bemanningService.addBemanning.mockResolvedValue(mockBemanning);

      await request(app)
        .post('/api/produksjon/1/bemanning')
        .send({
          personId: 1,
          kompetanseId: 1, // Gammelt felt - skal ignoreres
          talentId: 1,
          status: 'planlagt'
        })
        .expect(201);

      // Verifiser at kompetanseId IKKE sendes til service
      expect(bemanningService.addBemanning).toHaveBeenCalledWith(
        expect.objectContaining({
          talentId: 1
        })
      );
      expect(bemanningService.addBemanning).toHaveBeenCalledWith(
        expect.not.objectContaining({
          kompetanseId: expect.anything()
        })
      );
    });
  });
});

