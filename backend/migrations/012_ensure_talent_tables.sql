-- 012_ensure_talent_tables.sql
-- Sikrer at nødvendige talent-tabeller finnes i produksjonsdatabasen

BEGIN;

-- talentkategori
CREATE TABLE IF NOT EXISTS talentkategori (
  id SERIAL PRIMARY KEY,
  navn VARCHAR(100) NOT NULL,
  parent_id INTEGER REFERENCES talentkategori(id) ON DELETE CASCADE,
  beskrivelse TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(navn, parent_id)
);

-- talent
CREATE TABLE IF NOT EXISTS talent (
  id SERIAL PRIMARY KEY,
  navn VARCHAR(100) NOT NULL,
  kategori_id INTEGER NOT NULL REFERENCES talentkategori(id) ON DELETE RESTRICT,
  leder_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  beskrivelse TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- bruker_talent (mange-til-mange)
CREATE TABLE IF NOT EXISTS bruker_talent (
  id SERIAL PRIMARY KEY,
  bruker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  talent_id INTEGER NOT NULL REFERENCES talent(id) ON DELETE CASCADE,
  erfaringsnivaa VARCHAR(50) DEFAULT 'grunnleggende',
  sertifisert BOOLEAN DEFAULT false,
  notater TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (bruker_id, talent_id)
);

-- Indekser (CREATE INDEX IF NOT EXISTS brukes via dynamic execute for Postgres < 9.5 kompat.)
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_talent_kategori_id ON talent(kategori_id);
  CREATE INDEX IF NOT EXISTS idx_talent_leder_id ON talent(leder_id);
  CREATE INDEX IF NOT EXISTS idx_talentkategori_parent_id ON talentkategori(parent_id);
  CREATE INDEX IF NOT EXISTS idx_talentkategori_navn ON talentkategori(navn);
  CREATE INDEX IF NOT EXISTS idx_bruker_talent_bruker_id ON bruker_talent(bruker_id);
  CREATE INDEX IF NOT EXISTS idx_bruker_talent_talent_id ON bruker_talent(talent_id);
  CREATE INDEX IF NOT EXISTS idx_bruker_talent_erfaringsnivaa ON bruker_talent(erfaringsnivaa);
END $$;

COMMIT;


