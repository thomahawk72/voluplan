-- Migration 010: Add plassering to produksjon
-- Dato: 2025-10-13

ALTER TABLE produksjon
ADD COLUMN IF NOT EXISTS plassering VARCHAR(200);

COMMENT ON COLUMN produksjon.plassering IS 'Plassering/sted for denne produksjonen (kan arve fra kategori).';
