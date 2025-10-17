-- ============================================
-- RESET DATABASE - Sletter ALL DATA
-- ============================================
-- ADVARSEL: Dette sletter ALLE data fra databasen!
-- Bruk kun for testing/utvikling

-- Slette data i riktig rekkefølge (pga FK constraints)
DELETE FROM produksjon_bemanning;
DELETE FROM produksjon_oppmote;
DELETE FROM produksjon_plan_element;
DELETE FROM produksjon_talent_behov;
DELETE FROM produksjon;
DELETE FROM produksjonskategori_oppmote_mal;
DELETE FROM produksjonskategori_plan_mal_element;
DELETE FROM produksjonskategori_talent_mal;
DELETE FROM produksjonskategori;
DELETE FROM bruker_talent;
DELETE FROM talent;
DELETE FROM talentkategori;
DELETE FROM password_reset_tokens;
DELETE FROM users;

-- Reset sequences (slik at ID-er starter på 1 igjen)
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE talentkategori_id_seq RESTART WITH 1;
ALTER SEQUENCE talent_id_seq RESTART WITH 1;
ALTER SEQUENCE bruker_talent_id_seq RESTART WITH 1;
ALTER SEQUENCE produksjonskategori_id_seq RESTART WITH 1;
ALTER SEQUENCE produksjonskategori_talent_mal_id_seq RESTART WITH 1;
ALTER SEQUENCE produksjonskategori_plan_mal_element_id_seq RESTART WITH 1;
ALTER SEQUENCE produksjonskategori_oppmote_mal_id_seq RESTART WITH 1;
ALTER SEQUENCE produksjon_id_seq RESTART WITH 1;
ALTER SEQUENCE produksjon_talent_behov_id_seq RESTART WITH 1;
ALTER SEQUENCE produksjon_plan_element_id_seq RESTART WITH 1;
ALTER SEQUENCE produksjon_oppmote_id_seq RESTART WITH 1;
ALTER SEQUENCE produksjon_bemanning_id_seq RESTART WITH 1;
ALTER SEQUENCE password_reset_tokens_id_seq RESTART WITH 1;

-- Bekreftelse
SELECT 'Database reset fullført - alle data slettet' AS status;

