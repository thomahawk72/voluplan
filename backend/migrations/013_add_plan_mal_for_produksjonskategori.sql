-- Migrasjon 013: Legg til plan-mal funksjonalitet for produksjonskategorier
-- Opprettet: 2025-10-16
-- Beskrivelse: Gir mulighet til å definere standard agenda/plan for produksjonskategorier

-- Plan-mal element tabell (overskrifter OG hendelser)
CREATE TABLE IF NOT EXISTS produksjonskategori_plan_mal_element (
    id SERIAL PRIMARY KEY,
    kategori_id INTEGER NOT NULL REFERENCES produksjonskategori(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('overskrift', 'hendelse')),
    navn VARCHAR(200) NOT NULL,
    varighet_minutter INTEGER CHECK (varighet_minutter IS NULL OR varighet_minutter >= 0),
    parent_id INTEGER REFERENCES produksjonskategori_plan_mal_element(id) ON DELETE CASCADE,
    rekkefølge INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Constraints:
-- - Overskrifter MÅ ha parent_id = NULL og varighet_minutter = NULL
-- - Hendelser MÅ ha parent_id (referanse til overskrift) og varighet_minutter
ALTER TABLE produksjonskategori_plan_mal_element
ADD CONSTRAINT check_overskrift_struktur 
CHECK (
    (type = 'overskrift' AND parent_id IS NULL AND varighet_minutter IS NULL)
    OR
    (type = 'hendelse' AND parent_id IS NOT NULL AND varighet_minutter IS NOT NULL)
);

-- Indekser for ytelse
CREATE INDEX idx_plan_mal_kategori ON produksjonskategori_plan_mal_element(kategori_id);
CREATE INDEX idx_plan_mal_parent ON produksjonskategori_plan_mal_element(parent_id);
CREATE INDEX idx_plan_mal_rekkefølge ON produksjonskategori_plan_mal_element(kategori_id, parent_id, rekkefølge);

-- Kommentarer
COMMENT ON TABLE produksjonskategori_plan_mal_element IS 'Plan-mal elementer for produksjonskategorier. Støtter både overskrifter (grupperinger) og hendelser med varighet.';
COMMENT ON COLUMN produksjonskategori_plan_mal_element.type IS 'Type element: overskrift (gruppering) eller hendelse (tidsbasert aktivitet)';
COMMENT ON COLUMN produksjonskategori_plan_mal_element.varighet_minutter IS 'Varighet i minutter. NULL for overskrifter, påkrevd for hendelser.';
COMMENT ON COLUMN produksjonskategori_plan_mal_element.parent_id IS 'Referanse til overordnet overskrift. NULL for overskrifter, påkrevd for hendelser.';
COMMENT ON COLUMN produksjonskategori_plan_mal_element.rekkefølge IS 'Sorteringsrekkefølge innenfor samme kategori/parent.';

