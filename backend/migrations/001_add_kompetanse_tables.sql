-- Migrasjon: Legg til kompetansekategori og kompetanse tabeller
-- Dato: 2025-10-10

-- Kompetansekategori tabell
CREATE TABLE IF NOT EXISTS kompetansekategori (
    id SERIAL PRIMARY KEY,
    navn VARCHAR(100) UNIQUE NOT NULL,
    beskrivelse TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Kompetanse tabell
CREATE TABLE IF NOT EXISTS kompetanse (
    id SERIAL PRIMARY KEY,
    navn VARCHAR(100) NOT NULL,
    kategori_id INTEGER NOT NULL REFERENCES kompetansekategori(id) ON DELETE RESTRICT,
    leder_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    beskrivelse TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indekser for ytelse
CREATE INDEX IF NOT EXISTS idx_kompetanse_kategori_id ON kompetanse(kategori_id);
CREATE INDEX IF NOT EXISTS idx_kompetanse_leder_id ON kompetanse(leder_id);
CREATE INDEX IF NOT EXISTS idx_kompetansekategori_navn ON kompetansekategori(navn);

-- Legg til noen eksempel kategorier
INSERT INTO kompetansekategori (navn, beskrivelse) VALUES
    ('Lyd', 'Lydteknikk og -produksjon'),
    ('Lys', 'Lysdesign og belysning'),
    ('Scene', 'Sceneteknisk og rigging'),
    ('Video', 'Videoproduksjon og streaming')
ON CONFLICT (navn) DO NOTHING;

