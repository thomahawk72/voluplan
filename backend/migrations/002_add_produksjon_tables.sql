-- Migrasjon: Legg til produksjonsrelaterte tabeller
-- Dato: 2025-10-10

-- Produksjonskategori tabell
CREATE TABLE IF NOT EXISTS produksjonskategori (
    id SERIAL PRIMARY KEY,
    navn VARCHAR(100) UNIQUE NOT NULL,
    beskrivelse TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Produksjonsplan tabell
CREATE TABLE IF NOT EXISTS produksjonsplan (
    id SERIAL PRIMARY KEY,
    navn VARCHAR(200) NOT NULL,
    beskrivelse TEXT,
    start_dato DATE,
    slutt_dato DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Produksjon tabell
CREATE TABLE IF NOT EXISTS produksjon (
    id SERIAL PRIMARY KEY,
    navn VARCHAR(200) NOT NULL,
    tid TIMESTAMP NOT NULL,
    kategori_id INTEGER REFERENCES produksjonskategori(id) ON DELETE RESTRICT,
    publisert BOOLEAN DEFAULT false,
    beskrivelse TEXT,
    plan_id INTEGER REFERENCES produksjonsplan(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Junction/kobling-tabell for mange-til-mange relasjon
-- En produksjon har mange personer med ulike kompetanser
-- En person kan ha flere kompetanser i samme produksjon
-- En person kan være med i flere produksjoner
CREATE TABLE IF NOT EXISTS produksjon_bemanning (
    id SERIAL PRIMARY KEY,
    produksjon_id INTEGER NOT NULL REFERENCES produksjon(id) ON DELETE CASCADE,
    person_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kompetanse_id INTEGER NOT NULL REFERENCES kompetanse(id) ON DELETE RESTRICT,
    notater TEXT,
    status VARCHAR(50) DEFAULT 'planlagt',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- En person kan ha flere kompetanser i samme produksjon, men ikke duplikater
    UNIQUE (produksjon_id, person_id, kompetanse_id)
);

-- Indekser for ytelse
CREATE INDEX IF NOT EXISTS idx_produksjon_kategori_id ON produksjon(kategori_id);
CREATE INDEX IF NOT EXISTS idx_produksjon_plan_id ON produksjon(plan_id);
CREATE INDEX IF NOT EXISTS idx_produksjon_tid ON produksjon(tid);
CREATE INDEX IF NOT EXISTS idx_produksjon_publisert ON produksjon(publisert);
CREATE INDEX IF NOT EXISTS idx_produksjonskategori_navn ON produksjonskategori(navn);
CREATE INDEX IF NOT EXISTS idx_produksjonsplan_start_dato ON produksjonsplan(start_dato);
CREATE INDEX IF NOT EXISTS idx_produksjonsplan_slutt_dato ON produksjonsplan(slutt_dato);
CREATE INDEX IF NOT EXISTS idx_produksjon_bemanning_produksjon_id ON produksjon_bemanning(produksjon_id);
CREATE INDEX IF NOT EXISTS idx_produksjon_bemanning_person_id ON produksjon_bemanning(person_id);
CREATE INDEX IF NOT EXISTS idx_produksjon_bemanning_kompetanse_id ON produksjon_bemanning(kompetanse_id);

-- Legg til eksempeldata
INSERT INTO produksjonskategori (navn, beskrivelse) VALUES
    ('Konsert', 'Musikalske konserter og fremføringer'),
    ('Teater', 'Teaterproduksjoner og forestillinger'),
    ('Festival', 'Festivaler og større arrangementer'),
    ('Konferanse', 'Konferanser og møter')
ON CONFLICT (navn) DO NOTHING;

-- Eksempel produksjonsplan
INSERT INTO produksjonsplan (navn, beskrivelse, start_dato, slutt_dato) VALUES
    ('Høst 2025', 'Produksjoner for høsten 2025', '2025-09-01', '2025-12-31');

