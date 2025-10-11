-- Migrasjon 004: Endre kompetanse til talent og legg til hierarki
-- Dato: 2025-10-11

-- 1. Opprett nye tabeller med hierarki
CREATE TABLE IF NOT EXISTS talentkategori (
    id SERIAL PRIMARY KEY,
    navn VARCHAR(100) NOT NULL,
    parent_id INTEGER REFERENCES talentkategori(id) ON DELETE CASCADE,
    beskrivelse TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(navn, parent_id) -- Unik kombinasjon av navn og parent
);

CREATE TABLE IF NOT EXISTS talent (
    id SERIAL PRIMARY KEY,
    navn VARCHAR(100) NOT NULL,
    kategori_id INTEGER NOT NULL REFERENCES talentkategori(id) ON DELETE RESTRICT,
    leder_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    beskrivelse TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Migrer data fra gamle tabeller
INSERT INTO talentkategori (id, navn, parent_id, beskrivelse, created_at, updated_at)
SELECT id, navn, NULL, beskrivelse, created_at, updated_at
FROM kompetansekategori;

INSERT INTO talent (id, navn, kategori_id, leder_id, beskrivelse, created_at, updated_at)
SELECT id, navn, kategori_id, leder_id, beskrivelse, created_at, updated_at
FROM kompetanse;

-- 3. Oppdater produksjon_bemanning tabellen
ALTER TABLE produksjon_bemanning 
RENAME COLUMN kompetanse_id TO talent_id;

-- 4. Oppdater foreign key constraint
ALTER TABLE produksjon_bemanning 
DROP CONSTRAINT IF EXISTS produksjon_bemanning_kompetanse_id_fkey;

ALTER TABLE produksjon_bemanning 
ADD CONSTRAINT produksjon_bemanning_talent_id_fkey 
FOREIGN KEY (talent_id) REFERENCES talent(id) ON DELETE RESTRICT;

-- 5. Legg til indekser
CREATE INDEX IF NOT EXISTS idx_talentkategori_parent_id ON talentkategori(parent_id);
CREATE INDEX IF NOT EXISTS idx_talentkategori_navn ON talentkategori(navn);
CREATE INDEX IF NOT EXISTS idx_talent_kategori_id ON talent(kategori_id);
CREATE INDEX IF NOT EXISTS idx_talent_leder_id ON talent(leder_id);
CREATE INDEX IF NOT EXISTS idx_produksjon_bemanning_talent_id ON produksjon_bemanning(talent_id);

-- 6. Legg til kommentarer
COMMENT ON TABLE talentkategori IS 'Hierarkisk kategorisering av talenter (maks 2 nivåer)';
COMMENT ON TABLE talent IS 'Spesifikke talenter/kompetanser';
COMMENT ON COLUMN talentkategori.parent_id IS 'Referanse til overordnet kategori (NULL for root-nivå)';
COMMENT ON COLUMN produksjon_bemanning.talent_id IS 'Referanse til talent i stedet for kompetanse_id';

-- 7. Slett gamle tabeller (gjør dette forsiktig!)
-- DROP TABLE IF EXISTS kompetanse CASCADE;
-- DROP TABLE IF EXISTS kompetansekategori CASCADE;
