/**
 * TDD Test: Verifiser at opprettelse av produksjon med kategori-mal kopierer alt
 */

const service = require('../service');
const kategoriService = require('../../kategori/service');
const db = require('../../../../shared/config/database');

describe('Opprett produksjon med kategori-mal (TDD)', () => {
  let testKategoriId;
  let testTalentIds;
  let testTalentKategoriId;

  beforeAll(async () => {
    // Setup: Opprett talentkategori (autonomt - ikke avhengig av eksisterende data)
    const talentKategori = await db.query(
      'INSERT INTO talentkategori (navn, parent_id) VALUES ($1, $2) RETURNING id',
      ['TDD Test Talent Kategori', null]
    );
    testTalentKategoriId = talentKategori.rows[0].id;

    // Setup: Opprett test-kategori for produksjon
    const kategori = await db.query(
      'INSERT INTO produksjonskategori (navn, beskrivelse, plassering) VALUES ($1, $2, $3) RETURNING id',
      ['TDD Test Kategori', 'For testing', 'Test Location']
    );
    testKategoriId = kategori.rows[0].id;

    // Setup: Opprett test-talenter med vår egen kategori
    const talent1 = await db.query(
      'INSERT INTO talent (navn, kategori_id) VALUES ($1, $2) RETURNING id',
      ['Test Talent 1', testTalentKategoriId]
    );
    const talent2 = await db.query(
      'INSERT INTO talent (navn, kategori_id) VALUES ($1, $2) RETURNING id',
      ['Test Talent 2', testTalentKategoriId]
    );
    testTalentIds = [talent1.rows[0].id, talent2.rows[0].id];

    // Setup: Legg til talent-mal
    await db.query(
      'INSERT INTO produksjonskategori_talent_mal (kategori_id, talent_id, antall, beskrivelse) VALUES ($1, $2, $3, $4)',
      [testKategoriId, testTalentIds[0], 2, 'To personer']
    );
    await db.query(
      'INSERT INTO produksjonskategori_talent_mal (kategori_id, talent_id, antall, beskrivelse) VALUES ($1, $2, $3, $4)',
      [testKategoriId, testTalentIds[1], 1, 'En person']
    );

    // Setup: Legg til plan-mal
    const overskrift = await db.query(
      'INSERT INTO produksjonskategori_plan_mal_element (kategori_id, type, navn, rekkefølge) VALUES ($1, $2, $3, $4) RETURNING id',
      [testKategoriId, 'overskrift', 'Test Overskrift', 0]
    );
    await db.query(
      'INSERT INTO produksjonskategori_plan_mal_element (kategori_id, type, navn, varighet_minutter, parent_id, rekkefølge) VALUES ($1, $2, $3, $4, $5, $6)',
      [testKategoriId, 'hendelse', 'Test Hendelse', 30, overskrift.rows[0].id, 0]
    );

    // Setup: Legg til oppmøte-mal
    await db.query(
      'INSERT INTO produksjonskategori_oppmote_mal (kategori_id, navn, minutter_før_start, rekkefølge) VALUES ($1, $2, $3, $4)',
      [testKategoriId, 'Test Oppmøte', 60, 0]
    );
  });

  afterAll(async () => {
    // Cleanup: Slett test-data (i riktig rekkefølge pga foreign keys)
    await db.query('DELETE FROM produksjon WHERE navn LIKE $1', ['TDD Test Produksjon%']);
    await db.query('DELETE FROM talent WHERE navn LIKE $1', ['Test Talent%']);
    await db.query('DELETE FROM produksjonskategori WHERE id = $1', [testKategoriId]);
    await db.query('DELETE FROM talentkategori WHERE id = $1', [testTalentKategoriId]);
  });

  it('skal kopiere talent-behov når applyKategoriMal=true', async () => {
    // Arrange
    const produksjonData = {
      navn: 'TDD Test Produksjon 1',
      tid: new Date('2025-12-01T19:00:00'),
      kategoriId: testKategoriId,
      applyKategoriMal: true,
      publisert: false,
    };

    // Act
    const produksjon = await service.create(produksjonData);

    // Assert: Verifiser at produksjonen ble opprettet
    expect(produksjon).toBeDefined();
    expect(produksjon.id).toBeDefined();

    // Assert: Verifiser at talent-behov ble kopiert
    const talentBehov = await db.query(
      'SELECT * FROM produksjon_talent_behov WHERE produksjon_id = $1',
      [produksjon.id]
    );
    
    expect(talentBehov.rows.length).toBe(2);
    expect(talentBehov.rows[0].antall).toBe(2);
    expect(talentBehov.rows[1].antall).toBe(1);

    // Cleanup
    await db.query('DELETE FROM produksjon WHERE id = $1', [produksjon.id]);
  });

  it('skal kopiere plan-elementer når applyKategoriMal=true', async () => {
    // Arrange
    const produksjonData = {
      navn: 'TDD Test Produksjon 2',
      tid: new Date('2025-12-01T19:00:00'),
      kategoriId: testKategoriId,
      applyKategoriMal: true,
      publisert: false,
    };

    // Act
    const produksjon = await service.create(produksjonData);

    // Assert: Verifiser at plan-elementer ble kopiert
    const planElementer = await db.query(
      'SELECT * FROM produksjon_plan_element WHERE produksjon_id = $1',
      [produksjon.id]
    );
    
    expect(planElementer.rows.length).toBeGreaterThan(0);

    // Cleanup
    await db.query('DELETE FROM produksjon WHERE id = $1', [produksjon.id]);
  });

  it('skal kopiere oppmøtetider når applyKategoriMal=true', async () => {
    // Arrange
    const produksjonData = {
      navn: 'TDD Test Produksjon 3',
      tid: new Date('2025-12-01T19:00:00'),
      kategoriId: testKategoriId,
      applyKategoriMal: true,
      publisert: false,
    };

    // Act
    const produksjon = await service.create(produksjonData);

    // Assert: Verifiser at oppmøtetider ble kopiert
    const oppmote = await db.query(
      'SELECT * FROM produksjon_oppmote WHERE produksjon_id = $1',
      [produksjon.id]
    );
    
    expect(oppmote.rows.length).toBe(1);
    // Tidspunkt skal være 60 min før produksjonsstart (18:00)
    const expectedTime = new Date('2025-12-01T18:00:00');
    expect(new Date(oppmote.rows[0].tidspunkt)).toEqual(expectedTime);

    // Cleanup
    await db.query('DELETE FROM produksjon WHERE id = $1', [produksjon.id]);
  });

  it('skal IKKE kopiere når applyKategoriMal=false', async () => {
    // Arrange
    const produksjonData = {
      navn: 'TDD Test Produksjon 4',
      tid: new Date('2025-12-01T19:00:00'),
      kategoriId: testKategoriId,
      applyKategoriMal: false, // Skal IKKE kopiere
      publisert: false,
    };

    // Act
    const produksjon = await service.create(produksjonData);

    // Assert: Verifiser at INGENTING ble kopiert
    const talentBehov = await db.query(
      'SELECT * FROM produksjon_talent_behov WHERE produksjon_id = $1',
      [produksjon.id]
    );
    const planElementer = await db.query(
      'SELECT * FROM produksjon_plan_element WHERE produksjon_id = $1',
      [produksjon.id]
    );
    const oppmote = await db.query(
      'SELECT * FROM produksjon_oppmote WHERE produksjon_id = $1',
      [produksjon.id]
    );
    
    expect(talentBehov.rows.length).toBe(0);
    expect(planElementer.rows.length).toBe(0);
    expect(oppmote.rows.length).toBe(0);

    // Cleanup
    await db.query('DELETE FROM produksjon WHERE id = $1', [produksjon.id]);
  });
});

