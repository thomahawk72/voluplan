/**
 * Tester for bruker-talent funksjonalitet
 */

const service = require('../service');

// Mock database
jest.mock('../../../shared/config/database');
const db = require('../../../shared/config/database');

describe('Bruker-Talent Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findUserTalents', () => {
    it('skal hente alle talents for en bruker', async () => {
      const mockTalents = [
        {
          id: 1,
          bruker_id: 1,
          talent_id: 10,
          erfaringsnivaa: 'avansert',
          sertifisert: true,
          notater: 'Erfaren',
          created_at: '2025-01-01',
          talent_navn: 'FOH Lyd',
          kategori_id: 5,
          kategori_navn: 'Lyd → Band',
        },
      ];

      db.query.mockResolvedValue({ rows: mockTalents });

      const result = await service.findUserTalents(1);

      expect(result).toEqual(mockTalents);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1]
      );
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('bruker_talent'),
        [1]
      );
    });

    it('skal returnere tom array hvis bruker ikke har talents', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await service.findUserTalents(999);

      expect(result).toEqual([]);
    });
  });

  describe('addUserTalent', () => {
    it('skal legge til talent for bruker med alle felter', async () => {
      const mockTalent = {
        id: 1,
        bruker_id: 1,
        talent_id: 10,
        erfaringsnivaa: 'avansert',
        notater: 'Erfaren',
      };

      db.query.mockResolvedValue({ rows: [mockTalent] });

      const result = await service.addUserTalent(1, {
        talentId: 10,
        erfaringsnivaa: 'avansert',
        notater: 'Erfaren',
      });

      expect(result).toEqual(mockTalent);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO bruker_talent'),
        [1, 10, 'avansert', 'Erfaren']
      );
    });

    it('skal bruke default-verdier hvis ikke oppgitt', async () => {
      const mockTalent = {
        id: 1,
        bruker_id: 1,
        talent_id: 10,
        erfaringsnivaa: 'avansert',
        notater: null,
      };

      db.query.mockResolvedValue({ rows: [mockTalent] });

      const result = await service.addUserTalent(1, { talentId: 10 });

      expect(result).toEqual(mockTalent);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO bruker_talent'),
        [1, 10, 'avansert', null]
      );
    });
  });

  describe('updateUserTalent', () => {
    it('skal oppdatere erfaringsnivå', async () => {
      const mockUpdated = {
        id: 1,
        erfaringsnivaa: 'ekspert',
        notater: 'Oppdatert',
      };

      db.query.mockResolvedValue({ rows: [mockUpdated] });

      const result = await service.updateUserTalent(1, {
        erfaringsnivaa: 'ekspert',
      });

      expect(result).toEqual(mockUpdated);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE bruker_talent'),
        expect.arrayContaining(['ekspert', 1])
      );
    });

    it('skal returnere null hvis ingen felter oppdateres', async () => {
      const result = await service.updateUserTalent(1, {});

      expect(result).toBeNull();
      expect(db.query).not.toHaveBeenCalled();
    });
  });

  describe('removeUserTalent', () => {
    it('skal fjerne talent fra bruker', async () => {
      const mockDeleted = { id: 1 };
      db.query.mockResolvedValue({ rows: [mockDeleted] });

      const result = await service.removeUserTalent(1, 10);

      expect(result).toEqual(mockDeleted);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM bruker_talent'),
        [1, 10]
      );
    });

    it('skal returnere null hvis relasjon ikke finnes', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await service.removeUserTalent(999, 999);

      expect(result).toBeNull();
    });
  });

  describe('hasUserTalent', () => {
    it('skal returnere true hvis bruker har talentet', async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1 }] });

      const result = await service.hasUserTalent(1, 10);

      expect(result).toBe(true);
    });

    it('skal returnere false hvis bruker ikke har talentet', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await service.hasUserTalent(1, 999);

      expect(result).toBe(false);
    });
  });
});

