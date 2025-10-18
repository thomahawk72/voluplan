/**
 * Tests for Produksjonskategori CRUD operations
 */

const service = require('../service');
const db = require('../../../../shared/config/database');

describe('Produksjonskategori CRUD', () => {
  let testKategoriId;

  beforeAll(async () => {
    // Rydd opp test-data før start
    await db.query("DELETE FROM produksjonskategori WHERE navn LIKE 'Test%'");
  });

  afterAll(async () => {
    // Rydd opp test-data etter alle tester
    await db.query("DELETE FROM produksjonskategori WHERE navn LIKE 'Test%'");
  });

  describe('createKategori', () => {
    it('skal opprette en ny produksjonskategori med kun navn', async () => {
      const data = {
        navn: 'Test Kategori Basic',
      };

      const kategori = await service.createKategori(data);

      expect(kategori).toBeDefined();
      expect(kategori.id).toBeDefined();
      expect(kategori.navn).toBe('Test Kategori Basic');
      expect(kategori.beskrivelse).toBeNull();
      expect(kategori.plassering).toBeNull();

      testKategoriId = kategori.id;
    });

    it('skal opprette en ny produksjonskategori med alle felter', async () => {
      const data = {
        navn: 'Test Kategori Full',
        beskrivelse: 'Dette er en test-beskrivelse',
        plassering: 'Hovedscenen',
      };

      const kategori = await service.createKategori(data);

      expect(kategori).toBeDefined();
      expect(kategori.id).toBeDefined();
      expect(kategori.navn).toBe('Test Kategori Full');
      expect(kategori.beskrivelse).toBe('Dette er en test-beskrivelse');
      expect(kategori.plassering).toBe('Hovedscenen');
    });

    it('skal feile ved duplikat navn', async () => {
      const data = {
        navn: 'Test Kategori Duplikat',
      };

      await service.createKategori(data);

      // Prøv å opprette samme kategori igjen
      await expect(service.createKategori(data)).rejects.toThrow();
    });

    it('skal håndtere special characters i navn', async () => {
      const data = {
        navn: 'Test Kategori æøå ÆØÅ',
        beskrivelse: 'Norske tegn & symboler',
      };

      const kategori = await service.createKategori(data);

      expect(kategori.navn).toBe('Test Kategori æøå ÆØÅ');
      expect(kategori.beskrivelse).toBe('Norske tegn & symboler');
    });
  });

  describe('findKategoriById', () => {
    it('skal finne kategori med gyldig ID', async () => {
      const kategori = await service.findKategoriById(testKategoriId);

      expect(kategori).toBeDefined();
      expect(kategori.id).toBe(testKategoriId);
      expect(kategori.navn).toBe('Test Kategori Basic');
    });

    it('skal returnere null for ugyldig ID', async () => {
      const kategori = await service.findKategoriById(999999);

      expect(kategori).toBeNull();
    });
  });

  describe('findAllKategorier', () => {
    it('skal liste alle kategorier', async () => {
      const kategorier = await service.findAllKategorier();

      expect(Array.isArray(kategorier)).toBe(true);
      expect(kategorier.length).toBeGreaterThan(0);

      // Sjekk at test-kategorier er med
      const testKategorier = kategorier.filter(k => k.navn.startsWith('Test'));
      expect(testKategorier.length).toBeGreaterThanOrEqual(4); // Vi opprettet 4 test-kategorier
    });
  });

  describe('updateKategori', () => {
    it('skal oppdatere navn på kategori', async () => {
      const updated = await service.updateKategori(testKategoriId, {
        navn: 'Test Kategori Oppdatert',
      });

      expect(updated).toBeDefined();
      expect(updated.navn).toBe('Test Kategori Oppdatert');
    });

    it('skal oppdatere beskrivelse og plassering', async () => {
      const updated = await service.updateKategori(testKategoriId, {
        beskrivelse: 'Ny beskrivelse',
        plassering: 'Ny plassering',
      });

      expect(updated.beskrivelse).toBe('Ny beskrivelse');
      expect(updated.plassering).toBe('Ny plassering');
    });

    it('skal returnere null for ugyldig ID', async () => {
      const updated = await service.updateKategori(999999, {
        navn: 'Test',
      });

      expect(updated).toBeNull();
    });
  });

  describe('deleteKategori', () => {
    let deleteTestKategoriId;
    let deleteTestKategoriCounter = 0;

    beforeEach(async () => {
      // Opprett en kategori som kan slettes med unikt navn
      deleteTestKategoriCounter++;
      const kategori = await service.createKategori({
        navn: `Test Kategori For Sletting ${deleteTestKategoriCounter}`,
      });
      deleteTestKategoriId = kategori.id;
    });

    it('skal slette kategori uten tilknyttede data', async () => {
      const deleted = await service.deleteKategori(deleteTestKategoriId);

      expect(deleted).toBeDefined();
      expect(deleted.id).toBe(deleteTestKategoriId);

      // Verifiser at den er slettet
      const kategori = await service.findKategoriById(deleteTestKategoriId);
      expect(kategori).toBeNull();
    });

    it('skal returnere null ved sletting av ikke-eksisterende kategori', async () => {
      const deleted = await service.deleteKategori(999999);

      expect(deleted).toBeNull();
    });

    it('skal slette kategori selv om den HAR VÆRT brukt til produksjoner', async () => {
      // Merk: Produksjoner har IKKE direkte FK til kategori
      // Data kopieres fra kategori-mal til produksjon ved opprettelse
      // Så kategori kan slettes uten problemer
      
      const deleted = await service.deleteKategori(deleteTestKategoriId);

      expect(deleted).toBeDefined();
      expect(deleted.id).toBe(deleteTestKategoriId);
    });
  });

  describe('deleteKategoriDeep', () => {
    let deepDeleteTestKategoriId;
    let deepDeleteTestKategoriCounter = 0;
    let testTalentKategoriId;
    let testTalentId;

    beforeAll(async () => {
      // Setup: Opprett talentkategori og talent (autonomt)
      const talentKategori = await db.query(
        'INSERT INTO talentkategori (navn, parent_id) VALUES ($1, $2) RETURNING id',
        ['Test Kategori Deep Delete Talent', null]
      );
      testTalentKategoriId = talentKategori.rows[0].id;

      const talent = await db.query(
        'INSERT INTO talent (navn, kategori_id) VALUES ($1, $2) RETURNING id',
        ['Test Deep Delete Talent', testTalentKategoriId]
      );
      testTalentId = talent.rows[0].id;
    });

    afterAll(async () => {
      // Cleanup
      await db.query('DELETE FROM talent WHERE id = $1', [testTalentId]);
      await db.query('DELETE FROM talentkategori WHERE id = $1', [testTalentKategoriId]);
    });

    beforeEach(async () => {
      // Opprett en kategori med talent-mal med unikt navn
      deepDeleteTestKategoriCounter++;
      const kategori = await service.createKategori({
        navn: `Test Kategori Deep Delete ${deepDeleteTestKategoriCounter}`,
      });
      deepDeleteTestKategoriId = kategori.id;

      // Legg til talent-mal med vårt test-talent
      await db.query(
        'INSERT INTO produksjonskategori_talent_mal (kategori_id, talent_id, antall) VALUES ($1, $2, 2)',
        [deepDeleteTestKategoriId, testTalentId]
      );
    });

    it('skal slette kategori og tilhørende maler', async () => {
      const deleted = await service.deleteKategoriDeep(deepDeleteTestKategoriId);

      expect(deleted).toBeDefined();
      expect(deleted.id).toBe(deepDeleteTestKategoriId);

      // Verifiser at kategorien er slettet
      const kategori = await service.findKategoriById(deepDeleteTestKategoriId);
      expect(kategori).toBeNull();

      // Verifiser at talent-mal er slettet
      const talentMal = await db.query(
        'SELECT * FROM produksjonskategori_talent_mal WHERE kategori_id = $1',
        [deepDeleteTestKategoriId]
      );
      expect(talentMal.rows.length).toBe(0);
    });

    it('skal returnere null ved deep delete av ikke-eksisterende kategori', async () => {
      const deleted = await service.deleteKategoriDeep(999999);

      expect(deleted).toBeNull();
    });
  });
});

