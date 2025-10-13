-- Migration 008: Legg til talent-mal (template) for produksjonskategorier
-- Dato: 2025-10-13
-- Beskrivelse: Hver produksjonskategori kan ha en mal av talenter med antall

-- Tabell for talent-mal per produksjonskategori
CREATE TABLE IF NOT EXISTS produksjonskategori_talent_mal (
    id SERIAL PRIMARY KEY,
    kategori_id INTEGER NOT NULL REFERENCES produksjonskategori(id) ON DELETE CASCADE,
    talent_id INTEGER NOT NULL REFERENCES talent(id) ON DELETE CASCADE,
    antall INTEGER NOT NULL DEFAULT 1 CHECK (antall > 0),
    beskrivelse TEXT, -- Valgfri beskrivelse av rollen i denne kategorien
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (kategori_id, talent_id) -- En kategori kan kun ha et talent én gang i malen
);

-- Indekser for rask søking
CREATE INDEX idx_produksjonskategori_talent_mal_kategori_id 
    ON produksjonskategori_talent_mal(kategori_id);
CREATE INDEX idx_produksjonskategori_talent_mal_talent_id 
    ON produksjonskategori_talent_mal(talent_id);

-- Kommentar på tabell
COMMENT ON TABLE produksjonskategori_talent_mal IS 
    'Mal/template for talenter per produksjonskategori. Brukes til å populere bemanning ved opprettelse av ny produksjon.';

COMMENT ON COLUMN produksjonskategori_talent_mal.antall IS 
    'Antall personer med dette talentet som trengs (f.eks. 2 for to lydteknikere)';

