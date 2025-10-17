-- ============================================
-- CURRENT DATA SEED - Voluplan
-- ============================================
-- Generert fra dagens database
-- Alle passord: passord123

-- ============================================
-- BRUKERE
-- ============================================

INSERT INTO users (id, first_name, last_name, email, password_hash, google_id, facebook_id, roles, talents, is_active, phone_number) VALUES
(1, 'Test', 'Bruker', 'test@example.com', '$2b$10$fQ1mmJpkjrmDwsJ5nwx7K.6KhWOpGzgR8/sFU5T75pPoAGKqxpJnq', NULL, NULL, '{admin}', '{}', true, '12345678'),
(2, 'Ole', 'Nordmann', 'ole.nordmann@example.com', '$2b$10$fQ1mmJpkjrmDwsJ5nwx7K.6KhWOpGzgR8/sFU5T75pPoAGKqxpJnq', NULL, NULL, '{user}', '{}', true, '98765432'),
(3, 'Kari', 'Hansen', 'kari.hansen@example.com', '$2b$10$fQ1mmJpkjrmDwsJ5nwx7K.6KhWOpGzgR8/sFU5T75pPoAGKqxpJnq', NULL, NULL, '{user}', '{}', true, '45678901'),
(4, 'Per', 'Jensen', 'per.jensen@example.com', '$2b$10$fQ1mmJpkjrmDwsJ5nwx7K.6KhWOpGzgR8/sFU5T75pPoAGKqxpJnq', NULL, NULL, '{user}', '{}', true, '23456789'),
(5, 'Lise', 'Berg', 'lise.berg@example.com', '$2b$10$fQ1mmJpkjrmDwsJ5nwx7K.6KhWOpGzgR8/sFU5T75pPoAGKqxpJnq', NULL, NULL, '{user}', '{}', true, '34567890');

SELECT setval('users_id_seq', 5, true);

-- ============================================
-- TALENTKATEGORIER (3-nivå hierarki)
-- ============================================

INSERT INTO talentkategori (id, navn, parent_id, beskrivelse) VALUES
(2, 'Teknisk produksjon', NULL, 'Visuell dokumentasjon'),
(3, 'Kreativ/Innhold', NULL, 'Musikk, sang, dans, drama'),
(18, 'Vertskap', NULL, NULL),
(24, 'Salg', NULL, NULL),
(16, 'FOH', 2, NULL),
(8, 'Foto&Video', 2, 'Stillbilder'),
(23, 'Rigg', 2, NULL),
(19, 'Musikk', 3, NULL),
(20, 'Lovsang', 3, NULL),
(21, 'Dans', 3, NULL),
(22, 'Innhold', 3, 'Taler, underviser, konferansier, GTleder');

SELECT setval('talentkategori_id_seq', 24, true);

-- ============================================
-- TALENTS
-- ============================================

INSERT INTO talent (id, navn, kategori_id, leder_id, beskrivelse) VALUES
(21, 'Hovedmøtevert', 18, NULL, NULL),
(22, 'Møtevert', 18, NULL, NULL),
(23, 'Tolk - engelsk', 18, NULL, NULL),
(24, 'Infostand', 18, NULL, NULL),
(45, 'Velkomstteam', 18, NULL, NULL),
(46, 'Forbønn', 18, NULL, NULL),
(26, 'Lovsangsleder', 20, NULL, NULL),
(27, 'Lovsangsteam', 20, NULL, NULL),
(28, 'Vokalist', 20, NULL, NULL),
(29, 'Piano', 19, NULL, NULL),
(30, 'Trommer', 19, NULL, NULL),
(31, 'Bass', 19, NULL, NULL),
(32, 'Kassegitar', 19, NULL, NULL),
(33, 'El-gitar', 19, NULL, NULL),
(34, 'Strykere', 19, NULL, NULL),
(35, 'Undervisning', 22, NULL, NULL),
(36, 'GTleder', 22, NULL, NULL),
(37, 'Konferansier', 22, NULL, NULL),
(38, 'Regi', 8, NULL, NULL),
(39, 'Kameraoperatør', 8, NULL, NULL),
(43, 'Fotograf', 8, NULL, 'Stillbilder'),
(40, 'Lydtekniker', 16, NULL, NULL),
(41, 'Lys', 16, NULL, NULL),
(42, 'Projektor', 16, NULL, NULL),
(44, 'Teknisk leder', 16, NULL, NULL),
(47, 'Tilhengersjåfør', 23, NULL, NULL),
(48, 'Teknisk rigg', 23, NULL, NULL),
(49, 'Rigg', 23, NULL, NULL),
(50, 'Dekoratør', 23, NULL, NULL),
(51, 'Kiosk', 24, NULL, NULL),
(52, 'Kafémedarbeider', 24, NULL, NULL),
(53, 'Kjøkkenteam', 24, NULL, NULL);

SELECT setval('talent_id_seq', 53, true);

-- ============================================
-- BRUKER-TALENTS (hvem kan hva)
-- ============================================

INSERT INTO bruker_talent (id, bruker_id, talent_id, erfaringsnivaa, sertifisert, notater) VALUES
(10, 1, 38, 'avansert', false, NULL),
(11, 1, 39, 'avansert', false, NULL),
(16, 1, 35, 'avansert', false, NULL),
(12, 5, 29, 'avansert', false, NULL),
(13, 5, 32, 'avansert', false, NULL),
(14, 4, 36, 'avansert', false, NULL),
(15, 4, 37, 'avansert', false, NULL),
(17, 3, 26, 'avansert', false, NULL);

SELECT setval('bruker_talent_id_seq', 17, true);

-- ============================================
-- PRODUKSJONSKATEGORIER
-- ============================================
-- (Ingen kategorier i databasen - legg til her hvis du vil)

-- Bekreftelse
SELECT 'Current data seed lastet inn - klar for testing!' AS status;

