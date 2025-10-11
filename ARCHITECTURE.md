# Arkitektur - Voluplan

## Oversikt
Voluplan bruker en modulær arkitektur hvor hver forretningsområde er isolert i sin egen modul. Dette gjør det enkelt å utvide og vedlikeholde systemet uten å måtte forstå hele codebasen.

## Modulær Struktur

### Moduldefinisjon
Hver modul er en selvstendig enhet med:
- **Routes** - API-endepunkter
- **Controllers** - Forretningslogikk
- **Services** - Database-operasjoner og business logic
- **Models** - Datamodeller og valideringer
- **Tests** - Enhetstester for modulen

### Moduloversikt

```
backend/
├── modules/
│   ├── bruker/           # Brukermodul
│   │   ├── routes.js     # API routes for brukere
│   │   ├── controller.js # Brukerlogikk
│   │   ├── service.js    # Database-operasjoner
│   │   ├── model.js      # Bruker datamodell
│   │   └── __tests__/    # Tester for brukermodul
│   │
│   ├── kompetanse/       # Talentmodul (tidligere kompetansemodul)
│   │   ├── routes.js     # API routes for talenter
│   │   ├── controller.js # Talentlogikk
│   │   ├── service.js    # Database-operasjoner
│   │   ├── model.js      # Talent datamodell
│   │   └── __tests__/    # Tester for talentmodul
│   │
│   └── produksjon/       # Produksjonsmodul
│       ├── routes.js     # API routes for produksjoner
│       ├── controller.js # Produksjonslogikk
│       ├── service.js    # Database-operasjoner
│       ├── model.js      # Produksjon datamodell
│       └── __tests__/    # Tester for produksjonsmodul
│
├── shared/               # Delt funksjonalitet
│   ├── middleware/       # Express middleware
│   │   ├── auth.js       # Autentisering
│   │   └── rateLimiter.js
│   ├── utils/            # Hjelpefunksjoner
│   │   ├── envValidator.js
│   │   ├── errorHandler.js
│   │   ├── oauthHelpers.js
│   │   └── userMapper.js
│   ├── config/           # Konfigurasjon
│   │   ├── database.js
│   │   └── passport.js
│   └── services/         # Delte tjenester
│       └── emailService.js
│
├── migrations/           # Database-migrasjoner
├── server.js            # Express server entry point
└── package.json
```

---

## Moduler

### 1. Brukermodul (`modules/bruker`)

**Ansvar:**
- Brukerregistrering og innlogging
- Autentisering (lokal + OAuth)
- Passordgjenoppretting
- Profilhåndtering
- Rollestyring

**API Endpoints:**
```
POST   /api/auth/login              # Logg inn
POST   /api/auth/logout             # Logg ut
GET    /api/auth/me                 # Hent innlogget bruker
GET    /api/auth/google             # Google OAuth
GET    /api/auth/facebook           # Facebook OAuth
POST   /api/auth/forgot-password    # Be om passordtilbakestilling
POST   /api/auth/reset-password     # Tilbakestill passord

GET    /api/users                   # Liste brukere
GET    /api/users/:id               # Hent bruker
POST   /api/users                   # Opprett bruker
PUT    /api/users/:id               # Oppdater bruker
DELETE /api/users/:id               # Slett bruker
```

**Database-tabeller:**
- `users`
- `password_reset_tokens`

**Avhengigheter:**
- Shared: middleware (auth, rateLimiter)
- Shared: services (emailService)
- Shared: utils (userMapper, oauthHelpers)

---

### 2. Talentmodul (`modules/kompetanse`)

**Ansvar:**
- Administrere talentkategorier (hierarkisk struktur, maks 2 nivåer)
- Administrere talenter
- Knytte talenter til brukere
- Talentoversikter

**API Endpoints:**
```
# Kategorier
GET    /api/kompetanse/kategorier              # Liste kategorier (med hierarki)
GET    /api/kompetanse/kategorier/:id          # Hent kategori
POST   /api/kompetanse/kategorier              # Opprett kategori (kan ha parent_id)
PUT    /api/kompetanse/kategorier/:id          # Oppdater kategori
DELETE /api/kompetanse/kategorier/:id          # Slett kategori

# Talenter
GET    /api/kompetanse                         # Liste talenter
GET    /api/kompetanse/:id                     # Hent talent
POST   /api/kompetanse                         # Opprett talent
PUT    /api/kompetanse/:id                     # Oppdater talent
DELETE /api/kompetanse/:id                     # Slett talent

# Tilknytninger
GET    /api/kompetanse/bruker/:userId          # Talenter for bruker
GET    /api/kompetanse/:id/brukere             # Brukere med talent
```

**Database-tabeller:**
- `talentkategori` (med `parent_id` for hierarki)
- `talent`

**Hierarkisk struktur eksempel:**
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

**Avhengigheter:**
- Brukermodul: Hente brukerinfo for ledere
- Shared: middleware (auth)

---

### 3. Produksjonsmodul (`modules/produksjon`)

**Ansvar:**
- Administrere produksjonsplaner
- Administrere produksjonskategorier
- Administrere produksjoner/arrangementer
- Bemanningsplanlegging
- Produksjonsoversikter

**API Endpoints:**
```
# Planer
GET    /api/produksjon/planer                  # Liste planer
GET    /api/produksjon/planer/:id              # Hent plan
POST   /api/produksjon/planer                  # Opprett plan
PUT    /api/produksjon/planer/:id              # Oppdater plan
DELETE /api/produksjon/planer/:id              # Slett plan

# Kategorier
GET    /api/produksjon/kategorier              # Liste kategorier
GET    /api/produksjon/kategorier/:id          # Hent kategori
POST   /api/produksjon/kategorier              # Opprett kategori
PUT    /api/produksjon/kategorier/:id          # Oppdater kategori
DELETE /api/produksjon/kategorier/:id          # Slett kategori

# Produksjoner
GET    /api/produksjon                         # Liste produksjoner
GET    /api/produksjon/:id                     # Hent produksjon
POST   /api/produksjon                         # Opprett produksjon
PUT    /api/produksjon/:id                     # Oppdater produksjon
DELETE /api/produksjon/:id                     # Slett produksjon

# Bemanning
GET    /api/produksjon/:id/bemanning           # Hent bemanning for produksjon
POST   /api/produksjon/:id/bemanning           # Legg til person med talent i produksjon
PUT    /api/produksjon/:id/bemanning/:bemanningId  # Oppdater bemanning
DELETE /api/produksjon/:id/bemanning/:bemanningId  # Fjern person fra produksjon

# Dashboard
GET    /api/produksjon/kommende                # Kommende produksjoner
GET    /api/produksjon/gjennomfort             # Gjennomførte produksjoner
GET    /api/produksjon/bruker/:userId          # Produksjoner for bruker
```

**Database-tabeller:**
- `produksjonsplan`
- `produksjonskategori`
- `produksjon`
- `produksjon_bemanning`

**Avhengigheter:**
- Brukermodul: Hente brukerinfo for bemanning
- Talentmodul: Hente talentinfo for bemanning
- Shared: middleware (auth)

**Bemanning Data Struktur:**
```javascript
// POST /api/produksjon/:id/bemanning
{
  "personId": 1,
  "talentId": 1,        // OBS: talentId, ikke kompetanseId
  "notater": "Ansvarlig",
  "status": "bekreftet"
}

// Response
{
  "id": 1,
  "produksjon_id": 1,
  "person_id": 1,
  "talent_id": 1,
  "talent_navn": "FOH Lyd",
  "talent_kategori": "Lyd - Band",  // Hierarkisk kategori-navn
  "status": "bekreftet"
}
```

---

## Shared (Delt funksjonalitet)

### Middleware (`shared/middleware`)
- **auth.js** - JWT autentisering, sjekke roller
- **rateLimiter.js** - Rate limiting for API-endepunkter
- **errorHandler.js** - Global feilhåndtering

### Utils (`shared/utils`)
- **envValidator.js** - Validere miljøvariabler
- **errorHandler.js** - Feilhåndteringshjelpere
- **oauthHelpers.js** - OAuth callback-håndtering
- **userMapper.js** - Mappe database-brukere til API-format
- **validators.js** - Valideringsfunksjoner

### Config (`shared/config`)
- **database.js** - PostgreSQL connection pool
- **passport.js** - Passport OAuth-strategier

### Services (`shared/services`)
- **emailService.js** - E-postfunksjonalitet

---

## Designprinsipper

### 1. **Isolasjon**
Hver modul skal kunne endres uten å påvirke andre moduler. API-kontrakter mellom moduler skal være stabile.

### 2. **Single Responsibility**
Hver fil har ett tydelig ansvar:
- **Routes**: Definere HTTP-endepunkter og validering
- **Controllers**: Håndtere request/response, kalle services
- **Services**: Business logic og database-operasjoner
- **Models**: Datastrukturer og validering

### 3. **Dependency Injection**
Moduler mottar avhengigheter (database, services) som parametere, ikke hardkodede imports.

### 4. **Testbarhet**
All logikk skal kunne testes isolert. Mocking av avhengigheter skal være enkelt.

---

## Filstruktur per Modul

### routes.js
```javascript
const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authenticateToken } = require('../../shared/middleware/auth');

// Definer routes
router.get('/', authenticateToken, controller.list);
router.get('/:id', authenticateToken, controller.get);
router.post('/', authenticateToken, controller.create);
router.put('/:id', authenticateToken, controller.update);
router.delete('/:id', authenticateToken, controller.remove);

module.exports = router;
```

### controller.js
```javascript
const service = require('./service');
const { handleError } = require('../../shared/utils/errorHandler');

// Håndter HTTP-lag, kall service-lag
const list = async (req, res) => {
  try {
    const items = await service.findAll(req.query);
    res.json(items);
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = { list, get, create, update, remove };
```

### service.js
```javascript
const db = require('../../shared/config/database');
const Model = require('./model');

// Business logic og database-operasjoner
const findAll = async (filters) => {
  // SQL queries, business logic
  const result = await db.query('SELECT * FROM table WHERE ...');
  return result.rows.map(Model.fromDB);
};

module.exports = { findAll, findById, create, update, remove };
```

### model.js
```javascript
// Datamodell med validering og mapping
class Model {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    // ... andre felter
  }

  // Map fra database-format til API-format
  static fromDB(row) {
    return new Model({
      id: row.id,
      name: row.navn,
      // snake_case -> camelCase
    });
  }

  // Map fra API-format til database-format
  toDB() {
    return {
      id: this.id,
      navn: this.name,
      // camelCase -> snake_case
    };
  }

  // Validering
  validate() {
    if (!this.name) throw new Error('Name is required');
    // ... andre valideringer
  }
}

module.exports = Model;
```

---

## Opprette Ny Modul

For å legge til en ny modul (f.eks. "rapportering"):

1. **Opprett mappestruktur:**
```bash
mkdir -p backend/modules/rapportering
cd backend/modules/rapportering
touch routes.js controller.js service.js model.js
mkdir __tests__
```

2. **Implementer filene** (routes → controller → service → model)

3. **Registrer modul i server.js:**
```javascript
const rapporteringRoutes = require('./modules/rapportering/routes');
app.use('/api/rapportering', rapporteringRoutes);
```

4. **Skriv tester:**
```bash
touch __tests__/service.test.js
touch __tests__/controller.test.js
```

5. **Dokumenter API** i denne filen

---

## Testing

### Teststruktur
```
modules/
└── bruker/
    ├── __tests__/
    │   ├── service.test.js      # Test business logic
    │   ├── controller.test.js   # Test HTTP-håndtering
    │   └── model.test.js        # Test datamodell
    └── ...
```

### Kjøre tester
```bash
# Alle tester
npm test

# Spesifikk modul
npm test -- modules/bruker

# Watch mode
npm run test:watch
```

---

## Databasemigrasjoner

Hver modul har sine egne migrasjoner:

```
migrations/
├── 001_add_kompetanse_tables.sql           # Initial talent/kompetanse tabeller
├── 002_add_produksjon_tables.sql           # Produksjonstabeller
├── 003_add_phone_number.sql                # Telefonnummer til users
├── 004_rename_to_talent_and_hierarchy.sql  # Kompetanse→Talent + hierarki
└── 005_future_migration.sql
```

Navnekonvensjon:
- `XXX_beskrivelse.sql`
- XXX = sekvensnummer (001, 002, etc.)

**Viktig migrasjon (004):**
- Endret `kompetanse` → `talent`
- Endret `kompetansekategori` → `talentkategori`
- Lagt til hierarkisk struktur med `parent_id`
- Oppdatert `produksjon_bemanning.kompetanse_id` → `talent_id`
- Se `MIGRATION_NOTES.md` for detaljer

---

## Best Practices

### 1. **Module Independence**
Moduler skal kommunisere gjennom veldefinerte interfaces (services), ikke direkte database-tilgang.

### 2. **Error Handling**
Bruk sentralisert feilhåndtering i `shared/utils/errorHandler.js`.

### 3. **Validation**
Valider input i controller-laget (express-validator) og i model-laget (business rules).

### 4. **Logging**
Bruk konsistent logging med kontekst:
```javascript
console.log('[BRUKER] User logged in:', userId);
console.error('[PRODUKSJON] Failed to create production:', error);
```

### 5. **API Versioning**
Ved breaking changes, vurder API-versjonering:
```
/api/v1/produksjon
/api/v2/produksjon
```

---

## Eksempel: Tverrmodulær funksjonalitet

Når en modul trenger data fra en annen modul:

```javascript
// ❌ IKKE gjør dette (direkte database-tilgang)
const brukerData = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

// ✅ Gjør dette (via service)
const brukerService = require('../bruker/service');
const bruker = await brukerService.findById(userId);
```

Dette sikrer:
- Business logic er sentralisert
- Enklere testing (mock services)
- Lettere å refaktorere

---

## Migrering fra Eksisterende Struktur

For å migrere eksisterende `routes/auth.js` og `routes/users.js`:

1. Opprett `modules/bruker/`
2. Flytt auth-relatert kode til `modules/bruker/auth.controller.js`
3. Flytt bruker-relatert kode til `modules/bruker/user.controller.js`
4. Ekstraher database-kall til `modules/bruker/service.js`
5. Oppdater `server.js` til å bruke nye routes

---

## Skalerbarhet

Modulær arkitektur gjør det enkelt å:
- **Microservices**: Hver modul kan bli sin egen service
- **Team-arbeid**: Ulike team kan jobbe på forskjellige moduler
- **Feature flags**: Enkelt å skru av/på moduler
- **A/B testing**: Test ulike implementasjoner av samme modul

---

## Vedlikehold

### Når skal jeg oppdatere en modul?
- Kun når funksjonalitet innenfor modulens ansvarsområde endres
- Ved tverrmodulære endringer: oppdater interface/contract først

### Når skal jeg opprette ny modul?
- Når et nytt forretningsområde introduseres
- Når en eksisterende modul blir for stor (>1000 linjer kode)
- Når funksjonalitet deles av flere moduler (flytt til shared)

---

## Ressurser

- **Schema**: Se `DATABASE.md` for komplett oversikt over databaseskjema
- **API-dokumentasjon**: Se modulens `routes.js` for API-kontrakt
- **Eksempler**: Se eksisterende moduler for implementasjonseksempler
- **Migrasjoner**: Se `MIGRATION_NOTES.md` for detaljer om kompetanse→talent endringen

## Testing

Alle moduler skal ha omfattende tester:

### Eksempel: Produksjonsmodul
```bash
# Kjør alle produksjonstester
npm test -- modules/produksjon

# Service tests (12 tester)
npm test -- modules/produksjon/__tests__/service.test.js

# Integration tests (5 tester)
npm test -- modules/produksjon/__tests__/routes.integration.test.js
```

**Testdekning mål:** >80% for alle moduler

**Viktige ting å teste:**
- ✅ API returnerer riktige felt (talent_id, IKKE kompetanse_id)
- ✅ Hierarkisk kategori-navn konstrueres riktig
- ✅ Database queries bruker riktige tabellnavn
- ✅ Validering av input (talentId er påkrevd)
- ✅ Feilhåndtering (500 errors, 404 not found, etc.)


