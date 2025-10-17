-- Migrasjon 018: Revertere produksjon_bemanning.talent_id tilbake til RESTRICT
-- Dato: 2025-10-17
-- Beskrivelse: Produksjoner skal være uavhengige av talent-hierarkiet.
--              Når en talent slettes fra hierarkiet, skal den IKKE slettes fra produksjoner.
--              RESTRICT forhindrer sletting av talents som brukes i produksjoner.

-- Drop CASCADE constraint
ALTER TABLE produksjon_bemanning 
DROP CONSTRAINT IF EXISTS produksjon_bemanning_talent_id_fkey;

-- Add back RESTRICT constraint
ALTER TABLE produksjon_bemanning 
ADD CONSTRAINT produksjon_bemanning_talent_id_fkey 
FOREIGN KEY (talent_id) REFERENCES talent(id) ON DELETE RESTRICT;

