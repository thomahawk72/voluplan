-- Migrasjon 003: Legg til mobilnummer i users-tabellen
-- Dato: 2025-10-11

-- Legg til phone_number kolonne
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- Legg til kommentar på kolonnen
COMMENT ON COLUMN users.phone_number IS 'Brukerens mobilnummer for SMS-varsler';

