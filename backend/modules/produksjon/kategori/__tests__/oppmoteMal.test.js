/**
 * TDD Tester for Oppmøte-mal funksjonalitet
 * Tester CRUD-operasjoner for produksjonskategori oppmøte-mal
 */

const service = require('../service');
const db = require('../../../../shared/config/database');

// Mock database
jest.mock('../../../../shared/config/database');

describe('Oppmøte-mal Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOppmoteMalByKategoriId', () => {
    it('skal returnere alle oppmøtetider for en kategori sortert etter rekkefølge', async () => {
      const mockOppmoteMal = [
        {
          id: 1,
          kategori_id: 1,
          navn: 'Teknisk crew',
          beskrivelse: 'Rigge lyd og lys',
          minutter_før_start: 120,
          rekkefølge: 0
        },
        {
          id: 2,
          kategori_id: 1,
          navn: 'Skuespillere',
          beskrivelse: 'Prøve før forestilling',
          minutter_før_start: 60,
          rekkefølge: 1
        },
        {
          id: 3,
          kategori_id: 1,
          navn: 'Vertskap',
          beskrivelse: 'Møte publikum',
          minutter_før_start: 30,
          rekkefølge: 2
        }
      ];

      db.query.mockResolvedValue({ rows: mockOppmoteMal });

      const result = await service.findOppmoteMalByKategoriId(1);

      expect(result).toEqual(mockOppmoteMal);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1]
      );
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY rekkefølge'),
        [1]
      );
    });

    it('skal returnere tom array når kategori ikke har oppmøtetider', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await service.findOppmoteMalByKategoriId(99);

      expect(result).toEqual([]);
      expect(db.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('addOppmoteToKategoriMal', () => {
    it('skal legge til ny oppmøtetid med alle felt', async () => {
      const newOppmote = {
        kategoriId: 1,
        navn: 'Teknisk crew',
        beskrivelse: 'Rigge lyd og lys',
        minutterFørStart: 120,
        rekkefølge: 0
      };

      const mockResult = {
        id: 1,
        kategori_id: 1,
        navn: 'Teknisk crew',
        beskrivelse: 'Rigge lyd og lys',
        minutter_før_start: 120,
        rekkefølge: 0,
        created_at: new Date(),
        updated_at: new Date()
      };

      db.query.mockResolvedValue({ rows: [mockResult] });

      const result = await service.addOppmoteToKategoriMal(newOppmote);

      expect(result).toEqual(mockResult);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO produksjonskategori_oppmote_mal'),
        [1, 'Teknisk crew', 'Rigge lyd og lys', 120, 0]
      );
    });

    it('skal legge til oppmøtetid med default verdier', async () => {
      const newOppmote = {
        kategoriId: 1,
        navn: 'Skuespillere'
      };

      const mockResult = {
        id: 2,
        kategori_id: 1,
        navn: 'Skuespillere',
        beskrivelse: null,
        minutter_før_start: 0,
        rekkefølge: 0,
        created_at: new Date(),
        updated_at: new Date()
      };

      db.query.mockResolvedValue({ rows: [mockResult] });

      const result = await service.addOppmoteToKategoriMal(newOppmote);

      expect(result).toEqual(mockResult);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO produksjonskategori_oppmote_mal'),
        [1, 'Skuespillere', null, 0, 0]
      );
    });
  });

  describe('updateOppmoteInKategoriMal', () => {
    it('skal oppdatere alle felt på oppmøtetid', async () => {
      const updateData = {
        navn: 'Teknisk crew (oppdatert)',
        beskrivelse: 'Ny beskrivelse',
        minutterFørStart: 90,
        rekkefølge: 1
      };

      const mockResult = {
        id: 1,
        kategori_id: 1,
        navn: 'Teknisk crew (oppdatert)',
        beskrivelse: 'Ny beskrivelse',
        minutter_før_start: 90,
        rekkefølge: 1,
        updated_at: new Date()
      };

      db.query.mockResolvedValue({ rows: [mockResult] });

      const result = await service.updateOppmoteInKategoriMal(1, updateData);

      expect(result).toEqual(mockResult);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE produksjonskategori_oppmote_mal'),
        expect.arrayContaining([
          'Teknisk crew (oppdatert)',
          'Ny beskrivelse',
          90,
          1,
          1
        ])
      );
    });

    it('skal oppdatere bare noen felt', async () => {
      const updateData = {
        beskrivelse: 'Kun beskrivelse endret'
      };

      const mockResult = {
        id: 1,
        kategori_id: 1,
        navn: 'Teknisk crew',
        beskrivelse: 'Kun beskrivelse endret',
        minutter_før_start: 120,
        rekkefølge: 0,
        updated_at: new Date()
      };

      db.query.mockResolvedValue({ rows: [mockResult] });

      const result = await service.updateOppmoteInKategoriMal(1, updateData);

      expect(result).toEqual(mockResult);
    });

    it('skal returnere null når ingen felt oppdateres', async () => {
      const result = await service.updateOppmoteInKategoriMal(1, {});

      expect(result).toBeNull();
      expect(db.query).not.toHaveBeenCalled();
    });

    it('skal returnere null når oppmøtetid ikke finnes', async () => {
      const updateData = {
        navn: 'Test'
      };

      db.query.mockResolvedValue({ rows: [] });

      const result = await service.updateOppmoteInKategoriMal(99, updateData);

      expect(result).toBeNull();
    });
  });

  describe('updateOppmoteRekkefølge', () => {
    it('skal oppdatere kun rekkefølge', async () => {
      const mockResult = {
        id: 1,
        kategori_id: 1,
        navn: 'Teknisk crew',
        beskrivelse: 'Rigge lyd og lys',
        minutter_før_start: 120,
        rekkefølge: 5,
        updated_at: new Date()
      };

      db.query.mockResolvedValue({ rows: [mockResult] });

      const result = await service.updateOppmoteRekkefølge(1, 5);

      expect(result).toEqual(mockResult);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE produksjonskategori_oppmote_mal SET rekkefølge'),
        [5, 1]
      );
    });

    it('skal returnere null når oppmøtetid ikke finnes', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await service.updateOppmoteRekkefølge(99, 5);

      expect(result).toBeNull();
    });
  });

  describe('removeOppmoteFromKategoriMal', () => {
    it('skal slette oppmøtetid', async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1 }] });

      const result = await service.removeOppmoteFromKategoriMal(1);

      expect(result).toEqual({ id: 1 });
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM produksjonskategori_oppmote_mal'),
        [1]
      );
    });

    it('skal returnere null når oppmøtetid ikke finnes', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await service.removeOppmoteFromKategoriMal(99);

      expect(result).toBeNull();
    });
  });

  describe('Kompleks scenario: Opprette og administrere flere oppmøtetider', () => {
    it('skal håndtere flere oppmøtetider med ulik rekkefølge', async () => {
      // Add first
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          kategori_id: 1,
          navn: 'Først',
          minutter_før_start: 180,
          rekkefølge: 0
        }]
      });

      const first = await service.addOppmoteToKategoriMal({
        kategoriId: 1,
        navn: 'Først',
        minutterFørStart: 180,
        rekkefølge: 0
      });

      // Add second
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 2,
          kategori_id: 1,
          navn: 'Andre',
          minutter_før_start: 120,
          rekkefølge: 1
        }]
      });

      const second = await service.addOppmoteToKategoriMal({
        kategoriId: 1,
        navn: 'Andre',
        minutterFørStart: 120,
        rekkefølge: 1
      });

      // Get all
      db.query.mockResolvedValueOnce({
        rows: [first, second]
      });

      const all = await service.findOppmoteMalByKategoriId(1);

      expect(all).toHaveLength(2);
      expect(all[0].rekkefølge).toBe(0);
      expect(all[1].rekkefølge).toBe(1);
    });
  });
});
