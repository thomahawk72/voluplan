-- Migrasjon 017: Endre produksjon_bemanning.talent_id til ON DELETE CASCADE
-- Dato: 2025-10-17
-- Beskrivelse: Dette tillater sletting av talents som brukes i produksjoner
--              Når en talent slettes, fjernes også alle bemanning-oppføringer for det talentet.

-- Drop existing constraint
ALTER TABLE produksjon_bemanning 
DROP CONSTRAINT IF EXISTS produksjon_bemanning_talent_id_fkey;

-- Add new constraint with CASCADE
ALTER TABLE produksjon_bemanning 
ADD CONSTRAINT produksjon_bemanning_talent_id_fkey 
FOREIGN KEY (talent_id) REFERENCES talent(id) ON DELETE CASCADE;

