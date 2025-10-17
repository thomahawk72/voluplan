-- Migration: Legg til tabell for talent-behov per produksjon
-- Kopieres fra kategori talent-mal når produksjon opprettes
-- Viser hvor mange av hvert talent som trengs (uavhengig av faktisk bemanning)

CREATE TABLE IF NOT EXISTS produksjon_talent_behov (
    id SERIAL PRIMARY KEY,
    produksjon_id INTEGER NOT NULL REFERENCES produksjon(id) ON DELETE CASCADE,
    talent_id INTEGER NOT NULL REFERENCES talent(id) ON DELETE CASCADE,
    antall INTEGER NOT NULL DEFAULT 1 CHECK (antall > 0),
    beskrivelse TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (produksjon_id, talent_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_produksjon_talent_behov_produksjon_id 
    ON produksjon_talent_behov (produksjon_id);
CREATE INDEX IF NOT EXISTS idx_produksjon_talent_behov_talent_id 
    ON produksjon_talent_behov (talent_id);

-- Comments for documentation
COMMENT ON TABLE produksjon_talent_behov IS 'Talent-behov for en spesifikk produksjon, kopieres fra kategori talent-mal ved opprettelse';
COMMENT ON COLUMN produksjon_talent_behov.antall IS 'Antall personer med dette talentet som trengs';
COMMENT ON COLUMN produksjon_talent_behov.beskrivelse IS 'Beskrivelse av rollen/behovet';

