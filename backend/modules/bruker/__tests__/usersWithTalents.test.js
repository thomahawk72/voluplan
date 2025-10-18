/**
 * TDD Test: Hente brukere med talenter (for bemanning)
 */

const service = require('../service');
const db = require('../../../shared/config/database');

describe('Hente brukere med talenter for bemanning (TDD)', () => {
  let testUserId1, testUserId2, testTalentId1, testTalentId2, testKategoriId;

  beforeAll(async () => {
    // Cleanup først i tilfelle test feilet sist gang
    await db.query('DELETE FROM users WHERE email IN ($1, $2)', ['pianist-test@voluplan.test', 'gitarist-test@voluplan.test']);
    
    // Setup: Opprett talentkategori (autonomt - ikke avhengig av eksisterende data)
    const kategori = await db.query(
      'INSERT INTO talentkategori (navn, parent_id) VALUES ($1, $2) RETURNING id',
      ['Test Musikk Kategori', null]
    );
    testKategoriId = kategori.rows[0].id;

    // Setup: Opprett test-brukere
    const user1 = await db.query(
      'INSERT INTO users (first_name, last_name, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id',
      ['TDD', 'Pianist', 'pianist-test@voluplan.test', 'hash123']
    );
    testUserId1 = user1.rows[0].id;

    const user2 = await db.query(
      'INSERT INTO users (first_name, last_name, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id',
      ['TDD', 'Gitarist', 'gitarist-test@voluplan.test', 'hash123']
    );
    testUserId2 = user2.rows[0].id;

    // Setup: Opprett test-talenter med vår egen kategori
    const talent1 = await db.query(
      'INSERT INTO talent (navn, kategori_id) VALUES ($1, $2) RETURNING id',
      ['Test Piano Talent', testKategoriId]
    );
    testTalentId1 = talent1.rows[0].id;

    const talent2 = await db.query(
      'INSERT INTO talent (navn, kategori_id) VALUES ($1, $2) RETURNING id',
      ['Test Gitar Talent', testKategoriId]
    );
    testTalentId2 = talent2.rows[0].id;

    // Setup: Knytt brukere til talenter
    await db.query(
      'INSERT INTO bruker_talent (bruker_id, talent_id) VALUES ($1, $2)',
      [testUserId1, testTalentId1] // Pianist har piano
    );
    await db.query(
      'INSERT INTO bruker_talent (bruker_id, talent_id) VALUES ($1, $2)',
      [testUserId2, testTalentId2] // Gitarist har gitar
    );
    await db.query(
      'INSERT INTO bruker_talent (bruker_id, talent_id) VALUES ($1, $2)',
      [testUserId2, testTalentId1] // Gitarist har OGSÅ piano
    );
  });

  afterAll(async () => {
    // Cleanup (i riktig rekkefølge pga foreign keys)
    await db.query('DELETE FROM bruker_talent WHERE bruker_id IN ($1, $2)', [testUserId1, testUserId2]);
    await db.query('DELETE FROM users WHERE id IN ($1, $2)', [testUserId1, testUserId2]);
    await db.query('DELETE FROM talent WHERE id IN ($1, $2)', [testTalentId1, testTalentId2]);
    await db.query('DELETE FROM talentkategori WHERE id = $1', [testKategoriId]);
  });

  it('skal hente alle brukere med deres talenter', async () => {
    // Act
    const brukere = await service.findAllWithTalents();

    // Assert
    expect(Array.isArray(brukere)).toBe(true);
    
    const pianist = brukere.find(b => b.id === testUserId1);
    const gitarist = brukere.find(b => b.id === testUserId2);

    // Pianist skal ha 1 talent
    expect(pianist).toBeDefined();
    expect(pianist.first_name).toBe('TDD');
    expect(pianist.last_name).toBe('Pianist');
    expect(Array.isArray(pianist.talents)).toBe(true);
    expect(pianist.talents.length).toBe(1);
    expect(pianist.talents[0].talent_id).toBe(testTalentId1);
    expect(pianist.talents[0].talent_navn).toContain('Piano');

    // Gitarist skal ha 2 talenter
    expect(gitarist).toBeDefined();
    expect(gitarist.talents.length).toBe(2);
  });

  it('skal hente brukere filtrert på spesifikt talent', async () => {
    // Act: Hent kun brukere med piano-talent
    const brukereMedPiano = await service.findAllWithTalents({ talentId: testTalentId1 });

    // Assert: Både pianist og gitarist har piano
    expect(brukereMedPiano.length).toBeGreaterThanOrEqual(2);
    
    const pianist = brukereMedPiano.find(b => b.id === testUserId1);
    const gitarist = brukereMedPiano.find(b => b.id === testUserId2);

    expect(pianist).toBeDefined();
    expect(gitarist).toBeDefined();

    // Begge skal ha piano-talent i sin talents-array
    expect(pianist.talents.some(t => t.talent_id === testTalentId1)).toBe(true);
    expect(gitarist.talents.some(t => t.talent_id === testTalentId1)).toBe(true);
  });

  it('skal hente brukere filtrert på gitar-talent', async () => {
    // Act: Hent kun brukere med gitar-talent
    const brukereMedGitar = await service.findAllWithTalents({ talentId: testTalentId2 });

    // Assert: Kun gitaristen har gitar
    const gitarist = brukereMedGitar.find(b => b.id === testUserId2);
    const pianist = brukereMedGitar.find(b => b.id === testUserId1);

    expect(gitarist).toBeDefined();
    expect(pianist).toBeUndefined(); // Pianisten har IKKE gitar

    expect(gitarist.talents.some(t => t.talent_id === testTalentId2)).toBe(true);
  });

  it('skal returnere tom array hvis ingen har talentet', async () => {
    // Act: Hent brukere med et ikke-eksisterende talent
    const brukere = await service.findAllWithTalents({ talentId: 999999 });

    // Assert
    expect(Array.isArray(brukere)).toBe(true);
    expect(brukere.length).toBe(0);
  });

  it('skal returnere brukere med talent-kategorier', async () => {
    // Act
    const brukere = await service.findAllWithTalents();
    const brukerMedTalent = brukere.find(b => b.id === testUserId1);

    // Assert: Skal ha talent_kategori fra hierarkiet
    expect(brukerMedTalent.talents[0]).toHaveProperty('talent_kategori');
  });
});

