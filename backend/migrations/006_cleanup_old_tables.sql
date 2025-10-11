-- Migrasjon 006: Rydd opp i gamle kompetanse-tabeller
-- Dato: 2025-10-11
-- Beskrivelse: Sletter gamle kompetanse/kompetansekategori tabeller etter migrasjon til talent/talentkategori

-- VIKTIG: Denne migrasjonen kan IKKE reverseres!
-- Data er allerede migrert til talent/talentkategori i migrasjon 004

-- 1. Sjekk at ingen produksjon_bemanning bruker kompetanse_id (skal bruke talent_id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'produksjon_bemanning' 
    AND column_name = 'kompetanse_id'
  ) THEN
    RAISE EXCEPTION 'produksjon_bemanning har fortsatt kompetanse_id kolonne! Migrasjonen kan ikke kjøres.';
  END IF;
END $$;

-- 2. Dropp gamle tabeller (CASCADE for å fjerne alle avhengigheter)
DROP TABLE IF EXISTS kompetanse CASCADE;
DROP TABLE IF EXISTS kompetansekategori CASCADE;

-- 3. Bekreft at tabellene er borte
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name IN ('kompetanse', 'kompetansekategori')) THEN
    RAISE EXCEPTION 'Gamle tabeller er fortsatt tilstede!';
  END IF;
  
  RAISE NOTICE 'Gamle kompetanse-tabeller er slettet. Systemet bruker nå talent/talentkategori.';
END $$;

