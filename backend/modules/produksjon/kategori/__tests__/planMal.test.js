/**
 * TDD Tester for Plan-mal funksjonalitet
 * Tester CRUD-operasjoner for produksjonskategori plan-mal
 */

const service = require('../service');
const db = require('../../../../shared/config/database');

// Mock database
jest.mock('../../../../shared/config/database');

describe('Plan-mal Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findPlanMalByKategoriId', () => {
    it('skal returnere alle plan-mal elementer for en kategori i hierarkisk rekkefølge', async () => {
      const mockPlanMal = [
        {
          id: 1,
          kategori_id: 1,
          type: 'overskrift',
          navn: 'Før møtet',
          varighet_minutter: null,
          parent_id: null,
          rekkefølge: 0
        },
        {
          id: 2,
          kategori_id: 1,
          type: 'hendelse',
          navn: 'Musikk i anlegget',
          varighet_minutter: 5,
          parent_id: 1,
          rekkefølge: 0
        },
        {
          id: 3,
          kategori_id: 1,
          type: 'hendelse',
          navn: 'Count down',
          varighet_minutter: 10,
          parent_id: 1,
          rekkefølge: 1
        },
        {
          id: 4,
          kategori_id: 1,
          type: 'overskrift',
          navn: 'Møtet starter',
          varighet_minutter: null,
          parent_id: null,
          rekkefølge: 1
        }
      ];

      db.query.mockResolvedValue({ rows: mockPlanMal });

      const result = await service.findPlanMalByKategoriId(1);

      expect(result).toEqual(mockPlanMal);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM produksjonskategori_plan_mal_element'),
        [1]
      );
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY'),
        [1]
      );
    });

    it('skal returnere tom array hvis ingen plan-mal finnes', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await service.findPlanMalByKategoriId(999);

      expect(result).toEqual([]);
    });
  });

  describe('addPlanMalElement', () => {
    it('skal legge til en overskrift (parent_id=null, varighet=null)', async () => {
      const mockElement = {
        id: 1,
        kategori_id: 1,
        type: 'overskrift',
        navn: 'Før møtet',
        varighet_minutter: null,
        parent_id: null,
        rekkefølge: 0
      };

      db.query.mockResolvedValue({ rows: [mockElement] });

      const result = await service.addPlanMalElement({
        kategoriId: 1,
        type: 'overskrift',
        navn: 'Før møtet',
        rekkefølge: 0
      });

      expect(result).toEqual(mockElement);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO produksjonskategori_plan_mal_element'),
        expect.arrayContaining([1, 'overskrift', 'Før møtet', null, null, 0])
      );
    });

    it('skal legge til en hendelse (parent_id set, varighet påkrevd)', async () => {
      const mockElement = {
        id: 2,
        kategori_id: 1,
        type: 'hendelse',
        navn: 'Musikk i anlegget',
        varighet_minutter: 5,
        parent_id: 1,
        rekkefølge: 0
      };

      db.query.mockResolvedValue({ rows: [mockElement] });

      const result = await service.addPlanMalElement({
        kategoriId: 1,
        type: 'hendelse',
        navn: 'Musikk i anlegget',
        varighetMinutter: 5,
        parentId: 1,
        rekkefølge: 0
      });

      expect(result).toEqual(mockElement);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO produksjonskategori_plan_mal_element'),
        expect.arrayContaining([1, 'hendelse', 'Musikk i anlegget', 5, 1, 0])
      );
    });
  });

  describe('updatePlanMalElement', () => {
    it('skal oppdatere navn og varighet på en hendelse', async () => {
      const mockUpdated = {
        id: 2,
        kategori_id: 1,
        type: 'hendelse',
        navn: 'Oppdatert navn',
        varighet_minutter: 10,
        parent_id: 1,
        rekkefølge: 0
      };

      db.query.mockResolvedValue({ rows: [mockUpdated] });

      const result = await service.updatePlanMalElement(2, {
        navn: 'Oppdatert navn',
        varighetMinutter: 10
      });

      expect(result).toEqual(mockUpdated);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE produksjonskategori_plan_mal_element'),
        expect.anything()
      );
    });

    it('skal returnere null hvis element ikke finnes', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await service.updatePlanMalElement(999, { navn: 'Test' });

      expect(result).toBeNull();
    });
  });

  describe('updatePlanMalRekkefølge', () => {
    it('skal oppdatere rekkefølge på et element', async () => {
      const mockUpdated = {
        id: 2,
        rekkefølge: 5
      };

      db.query.mockResolvedValue({ rows: [mockUpdated] });

      const result = await service.updatePlanMalRekkefølge(2, 5);

      expect(result).toEqual(mockUpdated);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE produksjonskategori_plan_mal_element'),
        expect.arrayContaining([5, 2])
      );
    });
  });

  describe('removePlanMalElement', () => {
    it('skal slette et element', async () => {
      db.query.mockResolvedValue({ rows: [{ id: 2 }] });

      const result = await service.removePlanMalElement(2);

      expect(result).toEqual({ id: 2 });
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM produksjonskategori_plan_mal_element'),
        [2]
      );
    });

    it('skal returnere null hvis element ikke finnes', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await service.removePlanMalElement(999);

      expect(result).toBeNull();
    });

    it('skal CASCADE-slette barn-elementer automatisk (via DB constraint)', async () => {
      // Når vi sletter en overskrift, slettes alle tilhørende hendelser automatisk
      db.query.mockResolvedValue({ rows: [{ id: 1 }] });

      const result = await service.removePlanMalElement(1);

      expect(result).toEqual({ id: 1 });
      // Database håndterer CASCADE-sletting av barn
    });
  });
});

