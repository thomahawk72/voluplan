-- Migrasjon 019: Fjerne FK-avhengighet mellom produksjoner og talent-hierarkiet
-- Dato: 2025-10-17
-- Beskrivelse: Produksjoner skal være helt uavhengige av talent-hierarkiet.
--              Talent-data kopieres som tekst når produksjon opprettes.
--              Dette tillater at talents kan slettes fra hierarkiet uten å påvirke produksjoner.

-- ========================================
-- STEG 1: Legg til nye kolonner
-- ========================================

-- produksjon_talent_behov: Legg til tekstkolonner for talent-data
ALTER TABLE produksjon_talent_behov 
ADD COLUMN IF NOT EXISTS talent_navn VARCHAR(100),
ADD COLUMN IF NOT EXISTS talent_kategori_sti TEXT;

-- produksjon_bemanning: Legg til tekstkolonner for talent-data
ALTER TABLE produksjon_bemanning 
ADD COLUMN IF NOT EXISTS talent_navn VARCHAR(100),
ADD COLUMN IF NOT EXISTS talent_kategori_sti TEXT;

-- ========================================
-- STEG 2: Migrer eksisterende data
-- ========================================

-- Kopier talent-data fra FK-relasjoner til nye kolonner (produksjon_talent_behov)
UPDATE produksjon_talent_behov ptb
SET 
  talent_navn = t.navn,
  talent_kategori_sti = COALESCE(
    CASE
      WHEN tk3.parent_id IS NOT NULL AND tk2.parent_id IS NOT NULL THEN
        tk1.navn || ' → ' || tk2.navn || ' → ' || tk3.navn
      WHEN tk3.parent_id IS NOT NULL THEN
        tk2.navn || ' → ' || tk3.navn
      ELSE tk3.navn
    END,
    tk3.navn
  )
FROM talent t
LEFT JOIN talentkategori tk3 ON t.kategori_id = tk3.id
LEFT JOIN talentkategori tk2 ON tk3.parent_id = tk2.id
LEFT JOIN talentkategori tk1 ON tk2.parent_id = tk1.id
WHERE ptb.talent_id = t.id;

-- Kopier talent-data fra FK-relasjoner til nye kolonner (produksjon_bemanning)
UPDATE produksjon_bemanning pb
SET 
  talent_navn = t.navn,
  talent_kategori_sti = COALESCE(
    CASE
      WHEN tk3.parent_id IS NOT NULL AND tk2.parent_id IS NOT NULL THEN
        tk1.navn || ' → ' || tk2.navn || ' → ' || tk3.navn
      WHEN tk3.parent_id IS NOT NULL THEN
        tk2.navn || ' → ' || tk3.navn
      ELSE tk3.navn
    END,
    tk3.navn
  )
FROM talent t
LEFT JOIN talentkategori tk3 ON t.kategori_id = tk3.id
LEFT JOIN talentkategori tk2 ON tk3.parent_id = tk2.id
LEFT JOIN talentkategori tk1 ON tk2.parent_id = tk1.id
WHERE pb.talent_id = t.id;

-- ========================================
-- STEG 3: Fjern FK constraints og talent_id kolonner
-- ========================================

-- Fjern FK fra produksjon_talent_behov
ALTER TABLE produksjon_talent_behov 
DROP CONSTRAINT IF EXISTS produksjon_talent_behov_talent_id_fkey;

-- Fjern FK fra produksjon_bemanning
ALTER TABLE produksjon_bemanning 
DROP CONSTRAINT IF EXISTS produksjon_bemanning_talent_id_fkey;

-- Fjern talent_id kolonner
ALTER TABLE produksjon_talent_behov 
DROP COLUMN IF EXISTS talent_id;

ALTER TABLE produksjon_bemanning 
DROP COLUMN IF EXISTS talent_id;

-- ========================================
-- STEG 4: Sett NOT NULL på nye kolonner
-- ========================================

ALTER TABLE produksjon_talent_behov 
ALTER COLUMN talent_navn SET NOT NULL,
ALTER COLUMN talent_kategori_sti SET NOT NULL;

ALTER TABLE produksjon_bemanning 
ALTER COLUMN talent_navn SET NOT NULL,
ALTER COLUMN talent_kategori_sti SET NOT NULL;

-- ========================================
-- STEG 5: Oppdater UNIQUE constraint
-- ========================================

-- Fjern gamle UNIQUE constraints
ALTER TABLE produksjon_talent_behov 
DROP CONSTRAINT IF EXISTS produksjon_talent_behov_produksjon_id_talent_id_key;

ALTER TABLE produksjon_bemanning 
DROP CONSTRAINT IF EXISTS produksjon_bemanning_produksjon_id_person_id_talent_id_key;

-- Legg til nye UNIQUE constraints
ALTER TABLE produksjon_talent_behov 
ADD CONSTRAINT produksjon_talent_behov_produksjon_talent_unique 
UNIQUE (produksjon_id, talent_navn);

ALTER TABLE produksjon_bemanning 
ADD CONSTRAINT produksjon_bemanning_produksjon_person_talent_unique 
UNIQUE (produksjon_id, person_id, talent_navn);

-- ========================================
-- Ferdig!
-- ========================================

