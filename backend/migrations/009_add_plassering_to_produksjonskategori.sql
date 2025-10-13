-- Migration 009: Add plassering to produksjonskategori
-- Dato: 2025-10-13

ALTER TABLE produksjonskategori
ADD COLUMN IF NOT EXISTS plassering VARCHAR(200);

COMMENT ON COLUMN produksjonskategori.plassering IS 'Standard plassering/beskrivelse (f.eks. Scene, Backstage) for kategorien';
