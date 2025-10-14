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

---

# Migrasjon 008: Talent-maler for Produksjonskategorier

## Dato: 2025-10-13

## Oversikt
Produksjonskategorier kan nå ha forhåndsdefinerte talent-maler som definerer hvilke talenter og antall som trengs for en gitt type produksjon. Dette gjør det enkelt å sette opp bemanning for nye produksjoner.

## Database Endringer

### Ny Tabell: `produksjonskategori_talent_mal`
```sql
CREATE TABLE produksjonskategori_talent_mal (
    id SERIAL PRIMARY KEY,
    kategori_id INTEGER NOT NULL REFERENCES produksjonskategori(id) ON DELETE CASCADE,
    talent_id INTEGER NOT NULL REFERENCES talent(id) ON DELETE CASCADE,
    antall INTEGER NOT NULL DEFAULT 1 CHECK (antall > 0),
    beskrivelse TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (kategori_id, talent_id)
);
```

**Indexes:**
- `idx_produksjonskategori_talent_mal_kategori_id`
- `idx_produksjonskategori_talent_mal_talent_id`

## API Endringer

### Nye Endpoints

**Talent-mal for Produksjonskategori:**
```
GET    /api/produksjon/kategorier/:id/talent-mal         # Hent mal for kategori
POST   /api/produksjon/kategorier/:id/talent-mal         # Legg til talent i mal
PUT    /api/produksjon/kategorier/:id/talent-mal/:malId  # Oppdater talent i mal
DELETE /api/produksjon/kategorier/:id/talent-mal/:malId  # Fjern talent fra mal
```

**Oppdatert Endpoint:**
```
POST /api/produksjon                                     # Opprett produksjon
  - Ny parameter: applyTalentMal (boolean)
  - Hvis true, returneres talent-mal sammen med produksjonen
```

### Request/Response Eksempler

**POST /api/produksjon/kategorier/1/talent-mal**
```json
{
  "talentId": 5,
  "antall": 2,
  "beskrivelse": "Ansvarlig for FOH og Monitor"
}
```

**Response:**
```json
{
  "talentMal": {
    "id": 1,
    "kategori_id": 1,
    "talent_id": 5,
    "talent_navn": "Lydtekniker",
    "talent_kategori": "Foto&Video → Lyd",
    "antall": 2,
    "beskrivelse": "Ansvarlig for FOH og Monitor"
  }
}
```

**POST /api/produksjon (med talent-mal)**
```json
{
  "navn": "Julekonsert 2025",
  "tid": "2025-12-15T19:00:00Z",
  "kategoriId": 1,
  "applyTalentMal": true
}
```

**Response:**
```json
{
  "produksjon": {
    "id": 10,
    "navn": "Julekonsert 2025",
    ...
  },
  "talentMal": [
    {
      "talent_id": 5,
      "talent_navn": "Lydtekniker",
      "antall": 2,
      ...
    },
    ...
  ]
}
```

## Frontend Endringer

### Nye Komponenter
- `ProduksjonsKategoriMal.tsx` - UI for å konfigurere talent-maler

### Nye API-funksjoner
```typescript
// services/api.ts
export interface ProduksjonsKategoriTalentMal {
  id: number;
  kategori_id: number;
  talent_id: number;
  talent_navn: string;
  talent_kategori: string;
  antall: number;
  beskrivelse: string | null;
}

produksjonAPI.getTalentMal(kategoriId: number)
produksjonAPI.addTalentToMal(kategoriId, data)
produksjonAPI.updateTalentInMal(kategoriId, malId, data)
produksjonAPI.removeTalentFromMal(kategoriId, malId)
produksjonAPI.createProduksjon(data)  // Ny parameter: applyTalentMal
```

### UI Oppdateringer
- Settings-side: Ny tab "Produksjonskategorier" aktivert
- To-kolonne layout: Velg kategori (venstre), konfigurer mal (høyre)
- Dialog for å legge til/redigere talenter i malen med antall og beskrivelse

## Bruksscenario

### 1. Konfigurer Talent-mal
Admin går til Settings → Produksjonskategorier og setter opp mal for "Teaterforestilling":
- 2x Lydtekniker (Foto&Video → Lyd)
- 1x Piano (Musikk → Band)
- 2x Lysoperatør (Foto&Video → Lys)

### 2. Opprett Produksjon med Mal
Når admin oppretter ny produksjon:
1. Velger kategori "Teaterforestilling"
2. Setter `applyTalentMal = true`
3. Får returnert talent-malen som kan brukes til å populere bemanningslisten

**NB:** Malen returneres kun som data - frontend kan velge å populere bemanningslisten før lagring eller la brukeren legge til manuelt.

## Testing

### Backend
```bash
cd backend && npm test
```
Alle tester passerer ✅ (58 tester)

### Frontend
```bash
cd frontend && npm run build
```
Bygger uten feil ✅

### Manuell Testing
1. Gå til Settings → Produksjonskategorier
2. Velg en kategori
3. Legg til talenter med antall
4. Opprett ny produksjon med kategorien
5. Verifiser at talent-mal kan hentes

## Migrasjonssteg

```bash
# Database
psql -d voluplan -f backend/migrations/008_add_talent_mal_for_produksjonskategori.sql

# Backend (ingen endringer nødvendig - allerede deployet)
cd backend && npm start

# Frontend
cd frontend && npm run build
```

## Dokumentasjon Oppdatert
- ✅ DATABASE.md - Ny tabell dokumentert
- ✅ ARCHITECTURE.md - Nye API-endpoints dokumentert
- ✅ MIGRATION_NOTES.md - Denne seksjonen

## Fremtidige Forbedringer
- [ ] Auto-populering av bemanning ved produksjon-opprettelse (UI)
- [ ] Kopier mal fra en kategori til en annen
- [ ] Import/export av talent-maler
- [ ] Statistikk over mest brukte talenter per kategori

