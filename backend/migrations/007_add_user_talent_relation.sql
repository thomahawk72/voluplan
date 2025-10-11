-- Migrasjon 007: Legg til bruker-talent relasjon
-- Dato: 2025-10-11
-- Beskrivelse: Kobler brukere til talenter de innehar (mange-til-mange)

-- 1. Opprett koblingstabell for bruker-talent
CREATE TABLE IF NOT EXISTS bruker_talent (
    id SERIAL PRIMARY KEY,
    bruker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    talent_id INTEGER NOT NULL REFERENCES talent(id) ON DELETE CASCADE,
    erfaringsnivaa VARCHAR(50) DEFAULT 'grunnleggende', -- grunnleggende, middels, avansert, ekspert
    sertifisert BOOLEAN DEFAULT false,
    notater TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (bruker_id, talent_id)
);

-- 2. Indekser for rask oppslag
CREATE INDEX idx_bruker_talent_bruker_id ON bruker_talent(bruker_id);
CREATE INDEX idx_bruker_talent_talent_id ON bruker_talent(talent_id);
CREATE INDEX idx_bruker_talent_erfaringsnivaa ON bruker_talent(erfaringsnivaa);

-- 3. Endre competence_groups til talents i users tabellen
ALTER TABLE users RENAME COLUMN competence_groups TO talents;

-- 4. Oppdater kommentarer
COMMENT ON TABLE bruker_talent IS 'Mange-til-mange relasjon mellom brukere og talenter de innehar';
COMMENT ON COLUMN bruker_talent.erfaringsnivaa IS 'Brukerens erfaringsnivå med dette talentet';
COMMENT ON COLUMN bruker_talent.sertifisert IS 'Om brukeren er sertifisert i dette talentet';
COMMENT ON COLUMN users.talents IS 'Deprecated: Bruk bruker_talent tabell i stedet. Array beholdes for bakoverkompatibilitet.';

-- 5. Legg til constraint for å sikre at kun personer med talent kan bemennes
-- (Vi kan legge til dette senere når vi har migrert data)

-- Eksempel: Hvis du vil tvinge at person må ha talentet:
-- ALTER TABLE produksjon_bemanning ADD CONSTRAINT check_person_has_talent 
-- CHECK (
--   EXISTS (
--     SELECT 1 FROM bruker_talent 
--     WHERE bruker_id = person_id AND talent_id = produksjon_bemanning.talent_id
--   )
-- );

COMMENT ON TABLE produksjon_bemanning IS 'Bemanning av produksjoner. Person må ha talentet i bruker_talent for å kunne bemennes.';

