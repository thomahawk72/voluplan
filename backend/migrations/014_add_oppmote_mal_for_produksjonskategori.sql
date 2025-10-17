-- Migration: Legg til oppmøtetider mal for produksjonskategorier
-- Oppmøtetider definerer når ulike grupper/talenter skal møte opp

CREATE TABLE IF NOT EXISTS produksjonskategori_oppmote_mal (
    id SERIAL PRIMARY KEY,
    kategori_id INTEGER NOT NULL REFERENCES produksjonskategori(id) ON DELETE CASCADE,
    navn VARCHAR(200) NOT NULL,
    beskrivelse TEXT,
    minutter_før_start INTEGER NOT NULL DEFAULT 0, -- Antall minutter før produksjonsstart
    rekkefølge INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_minutter_før_start CHECK (minutter_før_start >= 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_produksjonskategori_oppmote_mal_kategori_id 
    ON produksjonskategori_oppmote_mal (kategori_id);
CREATE INDEX IF NOT EXISTS idx_produksjonskategori_oppmote_mal_sort_order 
    ON produksjonskategori_oppmote_mal (kategori_id, rekkefølge);

-- Comments for documentation
COMMENT ON TABLE produksjonskategori_oppmote_mal IS 'Mal for oppmøtetider i en produksjonskategori';
COMMENT ON COLUMN produksjonskategori_oppmote_mal.minutter_før_start IS 'Antall minutter før produksjonsstart denne gruppen skal møte (0 = samme tid som produksjonsstart)';
COMMENT ON COLUMN produksjonskategori_oppmote_mal.navn IS 'Beskrivende navn for oppmøtetiden, f.eks. "Teknisk crew" eller "Skuespillere"';
COMMENT ON COLUMN produksjonskategori_oppmote_mal.beskrivelse IS 'Valgfri beskrivelse av hva som skal gjøres ved oppmøte';

