/**
 * Produksjon Service
 * Håndterer database-operasjoner for produksjoner
 */

const db = require('../../../shared/config/database');
const kategoriService = require('../kategori/service');

/**
 * Finn alle produksjoner
 */
const findAll = async (filters = {}) => {
  let query = `
    SELECT 
      p.*,
      pp.navn as plan_navn,
      COUNT(DISTINCT pb.person_id) as antall_personer
    FROM produksjon p
    LEFT JOIN produksjonsplan pp ON p.plan_id = pp.id
    LEFT JOIN produksjon_bemanning pb ON p.id = pb.produksjon_id
  `;
  
  const conditions = [];
  const values = [];
  let paramCount = 1;
  
  // kategoriId er ikke lenger en del av modellen
  
  if (filters.planId) {
    conditions.push(`p.plan_id = $${paramCount++}`);
    values.push(filters.planId);
  }
  
  if (filters.publisert !== undefined) {
    conditions.push(`p.publisert = $${paramCount++}`);
    values.push(filters.publisert);
  }
  
  if (filters.kommende) {
    conditions.push(`p.tid > NOW()`);
  }
  
  if (filters.gjennomfort) {
    conditions.push(`p.tid < NOW()`);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' GROUP BY p.id, pp.navn ORDER BY p.tid DESC';
  
  const result = await db.query(query, values);
  return result.rows;
};

/**
 * Finn produksjon basert på ID
 */
const findById = async (id) => {
  const result = await db.query(
    `SELECT 
      p.*,
      pp.navn as plan_navn,
      COUNT(DISTINCT pb.person_id) as antall_personer
    FROM produksjon p
    LEFT JOIN produksjonsplan pp ON p.plan_id = pp.id
    LEFT JOIN produksjon_bemanning pb ON p.id = pb.produksjon_id
    WHERE p.id = $1
    GROUP BY p.id, pp.navn`,
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Opprett ny produksjon
 * Hvis applyKategoriMal=true og kategoriId er satt, kopieres plan, talenter og oppmøtetider fra malen
 */
const create = async (data) => {
  const { navn, tid, kategoriId, publisert, beskrivelse, planId, applyKategoriMal, plassering } = data;
  
  // Finn standard plassering fra kategori dersom ikke eksplisitt oppgitt
  let plasseringValue = plassering || null;
  if (!plasseringValue && kategoriId) {
    const katRes = await db.query('SELECT plassering FROM produksjonskategori WHERE id = $1', [kategoriId]);
    plasseringValue = katRes.rows[0]?.plassering || null;
  }

  // Opprett produksjonen
  const result = await db.query(
    'INSERT INTO produksjon (navn, tid, publisert, beskrivelse, plan_id, plassering) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [navn, tid, publisert || false, beskrivelse, planId, plasseringValue]
  );
  
  const produksjon = result.rows[0];
  
  // Hvis applyKategoriMal er true og kategori er satt, kopier data fra malen
  if (applyKategoriMal && kategoriId) {
    await applyKategoriMalToProduksjon(produksjon.id, kategoriId, new Date(tid));
  }
  
  return produksjon;
};

/**
 * Hjelpefunksjon: Kopier kategori-mal til produksjon
 * Kopierer plan-elementer, talenter (slots) og oppmøtetider
 */
const applyKategoriMalToProduksjon = async (produksjonId, kategoriId, produksjonTid) => {
  // Hent alle maler fra kategorien
  const [planMal, talentMal, oppmoteMal] = await Promise.all([
    kategoriService.findPlanMalByKategoriId(kategoriId),
    kategoriService.findTalentMalByKategoriId(kategoriId),
    kategoriService.findOppmoteMalByKategoriId(kategoriId),
  ]);
  
  // Kopier plan-elementer (overskrifter først, så hendelser)
  if (planMal && planMal.length > 0) {
    const parentIdMap = {}; // Map old parent_id to new parent_id
    
    // Først kopier overskrifter
    for (const element of planMal.filter(e => e.type === 'overskrift')) {
      const insertResult = await db.query(
        `INSERT INTO produksjon_plan_element 
          (produksjon_id, type, navn, varighet_minutter, parent_id, rekkefølge) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING id`,
        [produksjonId, element.type, element.navn, element.varighet_minutter, null, element.rekkefølge]
      );
      parentIdMap[element.id] = insertResult.rows[0].id;
    }
    
    // Deretter kopier hendelser med riktige parent_id
    for (const element of planMal.filter(e => e.type === 'hendelse')) {
      const newParentId = parentIdMap[element.parent_id];
      if (newParentId) {
        await db.query(
          `INSERT INTO produksjon_plan_element 
            (produksjon_id, type, navn, varighet_minutter, parent_id, rekkefølge) 
          VALUES ($1, $2, $3, $4, $5, $6)`,
          [produksjonId, element.type, element.navn, element.varighet_minutter, newParentId, element.rekkefølge]
        );
      }
    }
  }
  
  // Kopier talent-behov (antall av hvert talent som trengs)
  if (talentMal && talentMal.length > 0) {
    for (const talent of talentMal) {
      await db.query(
        `INSERT INTO produksjon_talent_behov 
          (produksjon_id, talent_id, antall, beskrivelse) 
        VALUES ($1, $2, $3, $4)`,
        [produksjonId, talent.talent_id, talent.antall, talent.beskrivelse]
      );
    }
  }
  
  // Kopier oppmøtetider med beregnet tidspunkt
  if (oppmoteMal && oppmoteMal.length > 0) {
    for (const oppmote of oppmoteMal) {
      // Beregn faktisk oppmøtetidspunkt basert på produksjonTid og minutter_før_start
      const oppmoteTidspunkt = new Date(produksjonTid.getTime() - (oppmote.minutter_før_start * 60 * 1000));
      
      await db.query(
        `INSERT INTO produksjon_oppmote 
          (produksjon_id, navn, beskrivelse, tidspunkt, rekkefølge) 
        VALUES ($1, $2, $3, $4, $5)`,
        [produksjonId, oppmote.navn, oppmote.beskrivelse, oppmoteTidspunkt, oppmote.rekkefølge]
      );
    }
  }
};

/**
 * Oppdater produksjon
 */
const update = async (id, data) => {
  const { navn, tid, kategoriId, publisert, beskrivelse, planId, plassering } = data;
  
  const updateFields = [];
  const values = [];
  let paramCount = 1;
  
  if (navn !== undefined) {
    updateFields.push(`navn = $${paramCount++}`);
    values.push(navn);
  }
  if (tid !== undefined) {
    updateFields.push(`tid = $${paramCount++}`);
    values.push(tid);
  }
  // kategoriId finnes ikke lenger på produksjon
  if (publisert !== undefined) {
    updateFields.push(`publisert = $${paramCount++}`);
    values.push(publisert);
  }
  if (beskrivelse !== undefined) {
    updateFields.push(`beskrivelse = $${paramCount++}`);
    values.push(beskrivelse);
  }
  if (planId !== undefined) {
    updateFields.push(`plan_id = $${paramCount++}`);
    values.push(planId);
  }
  if (plassering !== undefined) {
    updateFields.push(`plassering = $${paramCount++}`);
    values.push(plassering);
  }
  
  if (updateFields.length === 0) {
    return null;
  }
  
  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);
  
  const query = `UPDATE produksjon SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
  const result = await db.query(query, values);
  return result.rows[0] || null;
};

/**
 * Slett produksjon
 */
const remove = async (id) => {
  const result = await db.query(
    'DELETE FROM produksjon WHERE id = $1 RETURNING id',
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Finn produksjoner for en bruker
 */
const findByUserId = async (userId) => {
  const result = await db.query(
    `SELECT 
      p.*,
      pk.navn as kategori_navn,
      pp.navn as plan_navn,
      COUNT(DISTINCT pb.person_id) as antall_personer
    FROM produksjon p
    LEFT JOIN produksjonskategori pk ON p.kategori_id = pk.id
    LEFT JOIN produksjonsplan pp ON p.plan_id = pp.id
    LEFT JOIN produksjon_bemanning pb ON p.id = pb.produksjon_id
    WHERE p.id IN (
      SELECT DISTINCT produksjon_id 
      FROM produksjon_bemanning 
      WHERE person_id = $1
    )
    GROUP BY p.id, pk.navn, pp.navn
    ORDER BY p.tid DESC`,
    [userId]
  );
  return result.rows;
};

/**
 * Finn talent-behov for en produksjon
 */
const findTalentBehovByProduksjonId = async (produksjonId) => {
  const result = await db.query(
    `SELECT 
      ptb.*,
      t.navn as talent_navn,
      COALESCE(
        CASE 
          WHEN tk3.parent_id IS NOT NULL AND tk2.parent_id IS NOT NULL THEN 
            tk1.navn || ' → ' || tk2.navn || ' → ' || tk3.navn
          WHEN tk3.parent_id IS NOT NULL THEN 
            tk2.navn || ' → ' || tk3.navn
          ELSE tk3.navn
        END, 
        tk3.navn
      ) as talent_kategori
    FROM produksjon_talent_behov ptb
    JOIN talent t ON ptb.talent_id = t.id
    LEFT JOIN talentkategori tk3 ON t.kategori_id = tk3.id
    LEFT JOIN talentkategori tk2 ON tk3.parent_id = tk2.id
    LEFT JOIN talentkategori tk1 ON tk2.parent_id = tk1.id
    WHERE ptb.produksjon_id = $1
    ORDER BY 
      COALESCE(tk1.navn, tk2.navn, tk3.navn),
      COALESCE(tk2.navn, tk3.navn),
      tk3.navn,
      t.navn`,
    [produksjonId]
  );
  return result.rows;
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
  findByUserId,
  findTalentBehovByProduksjonId,
};

