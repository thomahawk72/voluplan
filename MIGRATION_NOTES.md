# Migrasjon: Kompetanse → Talent

## Oversikt
**Dato:** 2025-10-11  
**Versjon:** 004  
**Type:** Schema refaktorering

## Endringer

### Tabellnavn
- `kompetansekategori` → `talentkategori`
- `kompetanse` → `talent`
- `produksjon_bemanning.kompetanse_id` → `produksjon_bemanning.talent_id`

### Ny Funksjonalitet: Hierarkisk Talentkategori

`talentkategori` støtter nå 2-nivå hierarki via `parent_id` kolonne.

**Eksempel:**
```
Kreativ (root kategori)
├── Band (sub-kategori)
│   ├── Klassisk gitar (talent)
│   ├── Elektrisk gitar (talent)
│   └── Bassist (talent)
└── Vokal (sub-kategori)
    ├── Sopran (talent)
    └── Alt (talent)
```

### Database Schema

#### talentkategori
```sql
CREATE TABLE talentkategori (
    id SERIAL PRIMARY KEY,
    navn VARCHAR(100) NOT NULL,
    parent_id INTEGER REFERENCES talentkategori(id) ON DELETE CASCADE,
    beskrivelse TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(navn, parent_id)
);
```

#### talent
```sql
CREATE TABLE talent (
    id SERIAL PRIMARY KEY,
    navn VARCHAR(100) NOT NULL,
    kategori_id INTEGER NOT NULL REFERENCES talentkategori(id) ON DELETE RESTRICT,
    leder_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    beskrivelse TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endringer

### Backend

#### Endepunkter (uendret)
- `GET /api/produksjon/:id/bemanning`
- `POST /api/produksjon/:id/bemanning`
- `PUT /api/produksjon/:id/bemanning/:bemanningId`
- `DELETE /api/produksjon/:id/bemanning/:bemanningId`

#### Request/Response Endringer

**POST /api/produksjon/:id/bemanning**
```json
// FØR
{
  "personId": 1,
  "kompetanseId": 1,
  "notater": "Ansvarlig",
  "status": "bekreftet"
}

// ETTER
{
  "personId": 1,
  "talentId": 1,
  "notater": "Ansvarlig",
  "status": "bekreftet"
}
```

**GET /api/produksjon/:id/bemanning Response**
```json
// FØR
{
  "bemanning": [{
    "id": 1,
    "kompetanse_navn": "FOH Lyd",
    "kompetanse_kategori": "Lyd"
  }]
}

// ETTER
{
  "bemanning": [{
    "id": 1,
    "talent_navn": "FOH Lyd",
    "talent_kategori": "Lyd - Band"
  }]
}
```

### Frontend

#### Interface Endringer
```typescript
// services/api.ts
interface Bemanning {
  // FØR
  kompetanse_id: number;
  kompetanse_navn: string;
  kompetanse_kategori: string;
  
  // ETTER
  talent_id: number;
  talent_navn: string;
  talent_kategori: string;
}
```

#### UI Endringer
- Medarbeider-kort viser nå øverste nivå av talent-kategori som default
- Skuff-funksjonalitet for å åpne/lukke kategorier
- Hierarkisk kategori-navn: "Lyd - Band" i stedet for bare "Band"

## Testing

### Nye Tester
- `backend/modules/produksjon/__tests__/service.test.js` - 7 tester
- `backend/modules/produksjon/__tests__/routes.integration.test.js` - 5 tester

Alle tester passerer ✅

### Test Coverage
```
File                | % Stmts | % Branch | % Funcs | % Lines
--------------------|---------|----------|---------|--------
routes.js           |   96.77 |       50 |     100 |   96.77
```

## Migrasjonssteg

### 1. Database
```bash
psql -d voluplan -f backend/migrations/004_rename_to_talent_and_hierarchy.sql
```

### 2. Backend
- Oppdaterte filer:
  - `modules/kompetanse/service.js`
  - `modules/produksjon/service.js`
  - `modules/produksjon/controller.js`
  - `modules/produksjon/routes.js`

### 3. Frontend
- Oppdaterte filer:
  - `services/api.ts`
  - `pages/ProductionDetail.tsx`

## Bakoverkompatibilitet

⚠️ **BREAKING CHANGES:**
- API-endepunkter aksepterer IKKE lenger `kompetanseId`
- Frontend må bruke `talent_navn` og `talent_kategori`
- Gamle data migreres automatisk, men gamle API-kall vil feile

## Verifisering

### Database
```sql
-- Sjekk at data ble migrert
SELECT COUNT(*) FROM talent;
SELECT COUNT(*) FROM talentkategori;

-- Sjekk hierarki
SELECT 
  COALESCE(
    CASE 
      WHEN tk.parent_id IS NOT NULL THEN 
        (SELECT parent.navn FROM talentkategori parent WHERE parent.id = tk.parent_id) || ' - ' || tk.navn
      ELSE tk.navn
    END, 
    tk.navn
  ) as full_kategori_navn
FROM talentkategori tk;
```

### API
```bash
# Test bemanning endpoint (krever autentisering)
curl http://localhost:5001/api/produksjon/1/bemanning \
  -H "Authorization: Bearer <token>"
```

### Frontend
1. Naviger til produksjonsdetalj-siden
2. Verifiser at medarbeidere vises gruppert etter øverste talent-kategori
3. Klikk for å åpne/lukke kategorier
4. Verifiser at talent-navn vises korrekt

## Rollback Plan

Hvis nødvendig, reverter endringer i omvendt rekkefølge:
1. Reverter frontend til forrige commit
2. Reverter backend til forrige commit  
3. Kjør reverter-migrasjon (må lages manuelt om nødvendig)

**NB:** Hierarki-data vil gå tapt ved rollback hvis nye sub-kategorier er opprettet.

## Fremtidige Forbedringer

- [ ] Legg til API for å administrere talentkategorier med hierarki
- [ ] Frontend UI for å opprette/redigere talenter og kategorier
- [ ] Visualisering av talent-hierarki (tre-struktur)
- [ ] Søk/filter på talent-kategorier
- [ ] Export/import av talent-data

---

# Migrasjon 005-007: 3-nivå hierarki + Bruker-Talent relasjon

## Dato: 2025-10-11

### Migrasjon 005: Utvid til 3 nivåer
- Oppdatert kommentarer for å dokumentere 3-nivå støtte
- Ingen schema-endringer, kun dokumentasjon

### Migrasjon 006: Cleanup gamle tabeller
- Slettet `kompetanse` tabell
- Slettet `kompetansekategori` tabell
- **IRREVERSIBEL** - data allerede migrert i 004

### Migrasjon 007: Bruker-Talent relasjon
- Opprettet `bruker_talent` koblingstabell
- Endret `users.competence_groups` → `users.talents`
- **Breaking change:** Brukere må nå ha talent i `bruker_talent` før bemanning

## Ny Database Struktur

```
users (brukere)
  ↓
bruker_talent (mange-til-mange)
  ├─ erfaringsnivaa
  ├─ sertifisert
  └─ notater
  ↓
talent (spesifikke talenter)
  ↓
talentkategori (3-nivå hierarki)
  └─ Foto&Video (nivå 1)
      └─ Lyd (nivå 2)
          └─ Band (nivå 3)
```

## Backend Endringer
- Alle queries oppdatert til 3-nivå JOINs (tk1, tk2, tk3)
- Path separator endret til ` → ` (arrow)
- `competenceGroups` → `talents` i alle filer

## Frontend Endringer
- Gruppering på øverste nivå (før første →)
- Skuff-funksjonalitet for kategorier
- HTML nesting feil fikset i Dashboard

## Testing
- 41 tester passerer
- Nye tester for talent-hierarki
- Integration tester for bemanning med talentId

