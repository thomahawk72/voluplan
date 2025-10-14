-- 011_remove_kategori_fk_from_produksjon.sql
-- Fjerner kobling mellom produksjon og produksjonskategori

BEGIN;

-- Dropp eventuell constraint hvis den eksisterer
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT tc.constraint_name INTO constraint_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
   AND tc.table_schema = kcu.table_schema
  WHERE tc.table_name = 'produksjon'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'kategori_id'
  LIMIT 1;

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE produksjon DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

-- Dropp kolonnen dersom den finnes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='produksjon' AND column_name='kategori_id'
  ) THEN
    ALTER TABLE produksjon DROP COLUMN kategori_id;
  END IF;
END $$;

COMMIT;


