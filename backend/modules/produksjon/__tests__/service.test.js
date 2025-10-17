const bemanningService = require('../bemanning/service');
const produksjonService = require('../produksjon/service');
const db = require('../../../shared/config/database');

// Mock database
jest.mock('../../../shared/config/database');

describe('Produksjon Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findBemanningByProduksjonId', () => {
    it('skal returnere bemanning med talent-felter', async () => {
      const mockBemanning = [
        {
          id: 1,
          produksjon_id: 1,
          person_id: 1,
          talent_navn: 'FOH Lyd',
          talent_kategori: 'Lyd',
          notater: 'Test notater',
          status: 'bekreftet',
          first_name: 'Test',
          last_name: 'Bruker',
          email: 'test@example.com'
        }
      ];

      db.query.mockResolvedValue({ rows: mockBemanning });

      const result = await bemanningService.findBemanningByProduksjonId(1);

      expect(result).toEqual(mockBemanning);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('pb.talent_navn'),
        [1]
      );
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('pb.talent_kategori_sti'),
        [1]
      );
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM produksjon_bemanning pb'),
        [1]
      );
      // IKKE LENGER JOIN MED TALENT - produksjoner er uavhengige av talent-hierarkiet
      expect(db.query).not.toHaveBeenCalledWith(
        expect.stringContaining('JOIN talent'),
        expect.anything()
      );
    });

    it('skal returnere tomt array hvis ingen bemanning finnes', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await bemanningService.findBemanningByProduksjonId(999);

      expect(result).toEqual([]);
    });

    it('skal håndtere database-feil', async () => {
      db.query.mockRejectedValue(new Error('Database error'));

      await expect(bemanningService.findBemanningByProduksjonId(1)).rejects.toThrow('Database error');
    });
  });

  describe('addBemanning', () => {
    it('skal legge til bemanning med talentNavn og talentKategoriSti', async () => {
      const mockBemanning = {
        id: 1,
        produksjon_id: 1,
        person_id: 1,
        talent_navn: 'FOH Lyd',
        talent_kategori_sti: 'Lyd → Liveproduksjon',
        notater: 'Test notater',
        status: 'planlagt'
      };

      db.query.mockResolvedValue({ rows: [mockBemanning] });

      const result = await bemanningService.addBemanning({
        produksjonId: 1,
        personId: 1,
        talentNavn: 'FOH Lyd',
        talentKategoriSti: 'Lyd → Liveproduksjon',
        notater: 'Test notater',
        status: 'planlagt'
      });

      expect(result).toEqual(mockBemanning);
      expect(db.query).toHaveBeenCalledWith(
        'INSERT INTO produksjon_bemanning (produksjon_id, person_id, talent_navn, talent_kategori_sti, notater, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [1, 1, 'FOH Lyd', 'Lyd → Liveproduksjon', 'Test notater', 'planlagt']
      );
    });

    it('skal bruke default status "planlagt" hvis ikke oppgitt', async () => {
      const mockBemanning = {
        id: 1,
        produksjon_id: 1,
        person_id: 1,
        talent_navn: 'FOH Lyd',
        talent_kategori_sti: 'Lyd',
        notater: null,
        status: 'planlagt'
      };

      db.query.mockResolvedValue({ rows: [mockBemanning] });

      const result = await bemanningService.addBemanning({
        produksjonId: 1,
        personId: 1,
        talentNavn: 'FOH Lyd',
        talentKategoriSti: 'Lyd'
      });

      expect(result).toEqual(mockBemanning);
      expect(db.query).toHaveBeenCalledWith(
        expect.any(String),
        [1, 1, 'FOH Lyd', 'Lyd', undefined, 'planlagt']
      );
    });
  });

  describe('findById', () => {
    it('skal returnere produksjon med kategori og plan navn', async () => {
      const mockProduksjon = {
        id: 1,
        navn: 'Test Produksjon',
        tid: '2025-12-15T18:00:00.000Z',
        kategori_id: 1,
        publisert: true,
        beskrivelse: 'Test beskrivelse',
        plan_id: 1,
        kategori_navn: 'Konsert',
        plan_navn: 'Høst 2025',
        antall_personer: '2'
      };

      db.query.mockResolvedValue({ rows: [mockProduksjon] });

      const result = await produksjonService.findById(1);

      expect(result).toEqual(mockProduksjon);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('COUNT(DISTINCT pb.person_id) as antall_personer'),
        [1]
      );
    });

    it('skal returnere null hvis produksjon ikke finnes', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await produksjonService.findById(999);

      expect(result).toBeNull();
    });
  });
});

