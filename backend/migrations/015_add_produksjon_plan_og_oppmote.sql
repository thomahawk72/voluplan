-- Migration: Legg til tabeller for produksjon plan-elementer og oppmøtetider
-- Disse populeres fra kategori-maler når produksjon opprettes

-- Produksjon plan-elementer (kopieres fra kategori plan-mal)
CREATE TABLE IF NOT EXISTS produksjon_plan_element (
    id SERIAL PRIMARY KEY,
    produksjon_id INTEGER NOT NULL REFERENCES produksjon(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('overskrift', 'hendelse')),
    navn VARCHAR(200) NOT NULL,
    varighet_minutter INTEGER CHECK (varighet_minutter IS NULL OR varighet_minutter >= 0),
    parent_id INTEGER REFERENCES produksjon_plan_element(id) ON DELETE CASCADE,
    rekkefølge INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_produksjon_overskrift_struktur CHECK (
        (type = 'overskrift' AND parent_id IS NULL AND varighet_minutter IS NULL)
        OR
        (type = 'hendelse' AND parent_id IS NOT NULL AND varighet_minutter IS NOT NULL)
    )
);

-- Produksjon oppmøtetider (kopieres fra kategori oppmøte-mal)
CREATE TABLE IF NOT EXISTS produksjon_oppmote (
    id SERIAL PRIMARY KEY,
    produksjon_id INTEGER NOT NULL REFERENCES produksjon(id) ON DELETE CASCADE,
    navn VARCHAR(200) NOT NULL,
    beskrivelse TEXT,
    tidspunkt TIMESTAMP NOT NULL, -- Faktisk tid basert på produksjon.tid og minutter_før_start
    rekkefølge INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_produksjon_plan_element_produksjon_id 
    ON produksjon_plan_element (produksjon_id);
CREATE INDEX IF NOT EXISTS idx_produksjon_plan_element_parent_id 
    ON produksjon_plan_element (parent_id);
CREATE INDEX IF NOT EXISTS idx_produksjon_plan_element_sort_order 
    ON produksjon_plan_element (produksjon_id, parent_id, rekkefølge);

CREATE INDEX IF NOT EXISTS idx_produksjon_oppmote_produksjon_id 
    ON produksjon_oppmote (produksjon_id);
CREATE INDEX IF NOT EXISTS idx_produksjon_oppmote_tidspunkt 
    ON produksjon_oppmote (tidspunkt);
CREATE INDEX IF NOT EXISTS idx_produksjon_oppmote_sort_order 
    ON produksjon_oppmote (produksjon_id, rekkefølge);

-- Comments for documentation
COMMENT ON TABLE produksjon_plan_element IS 'Plan-elementer for en spesifikk produksjon, kopieres fra kategori plan-mal ved opprettelse';
COMMENT ON TABLE produksjon_oppmote IS 'Oppmøtetider for en spesifikk produksjon, kopieres fra kategori oppmøte-mal ved opprettelse';
COMMENT ON COLUMN produksjon_oppmote.tidspunkt IS 'Faktisk oppmøte-tid, beregnet fra produksjon.tid minus minutter_før_start fra malen';

