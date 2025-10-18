/**
 * Test for plan-elementer på produksjoner
 * TDD: Skriver tester først
 */

const service = require('../service');
const db = require('../../../../shared/config/database');

describe('Hent plan-elementer for produksjon', () => {
  let testProduksjonId;

  beforeAll(async () => {
    // Setup: Opprett test-produksjon
    const prod = await db.query(
      'INSERT INTO produksjon (navn, tid, publisert) VALUES ($1, $2, $3) RETURNING id',
      ['Test Produksjon med Plan', new Date('2025-12-01T19:00:00'), false]
    );
    testProduksjonId = prod.rows[0].id;

    // Opprett overskrift
    const overskrift = await db.query(
      'INSERT INTO produksjon_plan_element (produksjon_id, type, navn, parent_id, rekkefølge) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [testProduksjonId, 'overskrift', 'Før møtet', null, 0]
    );

    // Opprett hendelser under overskrift
    await db.query(
      'INSERT INTO produksjon_plan_element (produksjon_id, type, navn, varighet_minutter, parent_id, rekkefølge) VALUES ($1, $2, $3, $4, $5, $6)',
      [testProduksjonId, 'hendelse', 'Musikk i anlegget', 5, overskrift.rows[0].id, 0]
    );
    await db.query(
      'INSERT INTO produksjon_plan_element (produksjon_id, type, navn, varighet_minutter, parent_id, rekkefølge) VALUES ($1, $2, $3, $4, $5, $6)',
      [testProduksjonId, 'hendelse', 'Count down', 10, overskrift.rows[0].id, 1]
    );
  });

  afterAll(async () => {
    // Cleanup
    await db.query('DELETE FROM produksjon WHERE id = $1', [testProduksjonId]);
  });

  it('skal returnere plan-elementer for en produksjon', async () => {
    const planElementer = await service.findPlanElementerByProduksjonId(testProduksjonId);
    
    expect(planElementer).toBeDefined();
    expect(planElementer.length).toBe(3); // 1 overskrift + 2 hendelser
  });

  it('skal returnere plan-elementer i hierarkisk rekkefølge', async () => {
    const planElementer = await service.findPlanElementerByProduksjonId(testProduksjonId);
    
    // Første element skal være overskriften
    expect(planElementer[0].type).toBe('overskrift');
    expect(planElementer[0].navn).toBe('Før møtet');
    expect(planElementer[0].parent_id).toBeNull();
    
    // Neste elementer skal være hendelser under overskriften
    expect(planElementer[1].type).toBe('hendelse');
    expect(planElementer[1].parent_id).toBe(planElementer[0].id);
    
    expect(planElementer[2].type).toBe('hendelse');
    expect(planElementer[2].parent_id).toBe(planElementer[0].id);
  });

  it('skal returnere tom array hvis produksjon ikke har plan-elementer', async () => {
    // Opprett produksjon uten plan-elementer
    const emptyProd = await db.query(
      'INSERT INTO produksjon (navn, tid, publisert) VALUES ($1, $2, $3) RETURNING id',
      ['Produksjon uten plan', new Date('2025-12-15T19:00:00'), false]
    );
    
    const planElementer = await service.findPlanElementerByProduksjonId(emptyProd.rows[0].id);
    
    expect(planElementer).toBeDefined();
    expect(planElementer.length).toBe(0);
    
    // Cleanup
    await db.query('DELETE FROM produksjon WHERE id = $1', [emptyProd.rows[0].id]);
  });

  it('skal inkludere varighet_minutter for hendelser', async () => {
    const planElementer = await service.findPlanElementerByProduksjonId(testProduksjonId);
    
    const hendelser = planElementer.filter(e => e.type === 'hendelse');
    expect(hendelser.length).toBe(2);
    expect(hendelser[0].varighet_minutter).toBe(5);
    expect(hendelser[1].varighet_minutter).toBe(10);
  });
});

