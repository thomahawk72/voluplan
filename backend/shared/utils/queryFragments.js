/**
 * Gjenbrukbare SQL query fragmenter
 * Eliminerer duplikatkode på tvers av moduler
 */

/**
 * Komplett 3-nivå hierarki for talent kategorier
 * Brukes i: kompetanse/service.js, produksjon/bemanning/service.js
 */
const TALENT_HIERARKI_JOINS = `
  LEFT JOIN talent_kategori tk1 ON tk.talent_kategori_id = tk1.id
  LEFT JOIN talent_kategori tk2 ON tk1.forelder_id = tk2.id
  LEFT JOIN talent_kategori tk3 ON tk2.forelder_id = tk3.id
`;

const TALENT_HIERARKI_PATH = `
  CASE
    WHEN tk3.id IS NOT NULL THEN tk3.navn || ' → ' || tk2.navn || ' → ' || tk1.navn
    WHEN tk2.id IS NOT NULL THEN tk2.navn || ' → ' || tk1.navn
    ELSE tk1.navn
  END
`;

/**
 * Bygger full hierarki path for en talent kategori
 */
const buildTalentPath = (tk1, tk2, tk3) => {
  if (tk3) return `${tk3} → ${tk2} → ${tk1}`;
  if (tk2) return `${tk2} → ${tk1}`;
  return tk1;
};

/**
 * Standardiserte SELECT clauses
 */
const PRODUKSJON_SELECT = `
  p.id,
  p.navn,
  p.beskrivelse,
  p.tid,
  p.plassering,
  p.produksjonskategori_id,
  pk.navn as kategori_navn
`;

const BRUKER_SELECT = `
  b.id,
  b.fornavn,
  b.etternavn,
  b.email,
  b.telefon,
  b.roles,
  b.created_at
`;

/**
 * Database error codes → user-friendly messages
 */
const ERROR_MESSAGES = {
  '23505': 'Denne verdien finnes allerede i databasen',
  '23503': 'Referanse til data som ikke finnes',
  '23502': 'Påkrevd felt mangler',
  '42P01': 'Tabellen finnes ikke',
  '42703': 'Kolonnen finnes ikke',
  '22P02': 'Ugyldig dataformat',
};

module.exports = {
  TALENT_HIERARKI_JOINS,
  TALENT_HIERARKI_PATH,
  buildTalentPath,
  PRODUKSJON_SELECT,
  BRUKER_SELECT,
  ERROR_MESSAGES,
};

