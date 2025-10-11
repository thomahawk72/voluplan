-- Migrasjon 005: Utvid talentkategori til 3 nivåer
-- Dato: 2025-10-11

-- Fjern eksisterende constraint som begrenser til 2 nivåer
-- (Det var bare en kommentar i koden, ingen database constraint)

-- Legg til kommentar som dokumenterer 3-nivå struktur
COMMENT ON COLUMN talentkategori.parent_id IS 'Referanse til overordnet kategori (NULL for root-nivå, maks 3 nivåer)';

COMMENT ON TABLE talentkategori IS 'Hierarkisk kategorisering av talenter (maks 3 nivåer: Root → Sub → Detail)';

-- Eksempel struktur:
-- Foto&Video (nivå 1 - root)
--   └─ Lyd (nivå 2 - sub)
--       └─ Band (nivå 3 - detail)
--           └─ Klassisk gitar (talent)

