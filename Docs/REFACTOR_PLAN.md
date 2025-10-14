# Refaktoreringsplan - Voluplan

**Versjon:** 1.0  
**Opprettet:** 2025-10-14  
**Status:** I gang

## Mål
Forbedre arkitektur, vedlikeholdbarhet og AI-vennlighet i Voluplan ved å:
- Redusere modulstørrelse og kompleksitet
- Eliminere duplikat kode
- Standardisere grensesnitt og typer
- Automatisere migrasjoner og testing
- Forbedre dokumentasjon

---

## Overordnet Status

- ✅ **Fullført:** 1/14 steg
- 🚧 **Pågående:** 0/14 steg
- ⏳ **Venter:** 13/14 steg

---

## Steg 1: Refaktor produksjon-modul til delmoduler
**Status:** ✅ Fullført  
**Faktisk tid:** 2 timer

### Mål
Splitte den store `backend/modules/produksjon/` modulen i 4 separate delmoduler:
- `plan/` - Produksjonsplaner
- `kategori/` - Produksjonskategorier og talent-maler
- `produksjon/` - Hovedproduksjoner
- `bemanning/` - Bemanning/medarbeidere

### Deloppgaver
- [x] Opprett mappestruktur for delmoduler
- [x] Flytt plan-relaterte ruter/controller/service til `plan/`
- [x] Flytt kategori-relaterte ruter/controller/service til `kategori/`
- [x] Flytt produksjon-relaterte ruter/controller/service til `produksjon/`
- [x] Flytt bemanning-relaterte ruter/controller/service til `bemanning/`
- [x] Oppdater hovedroutes (`backend/modules/produksjon/routes.js`) til å aggregere delmoduler
- [x] Kjør backend tester (`npm test`)
- [x] Oppdater `ARCHITECTURE.md` med ny modulstruktur

### Suksesskriterier
- ✅ Alle backend-tester passerer (63/63 tester grønne)
- ✅ Ingen fil over 250 linjer (største fil: kategori/service.js 219 linjer)
- ✅ Klar separasjon mellom domener (4 selvstendige delmoduler)
- ✅ README for hver delmodul (4x README + hovedREADME oppdatert)

### Resultat
**Filstørrelser før refaktorering:**
- `controller.js`: 480 linjer (over grense)
- `service.js`: 610 linjer (over grense)
- `routes.js`: 132 linjer (OK)

**Filstørrelser etter refaktorering:**
- `plan/service.js`: 104 linjer ✅
- `plan/controller.js`: 93 linjer ✅
- `kategori/service.js`: 219 linjer ✅
- `kategori/controller.js`: 186 linjer ✅
- `produksjon/service.js`: 188 linjer ✅
- `produksjon/controller.js`: 135 linjer ✅
- `bemanning/service.js`: 101 linjer ✅
- `bemanning/controller.js`: 84 linjer ✅
- `routes.js` (aggregator): 21 linjer ✅

**Test Coverage:**
- Alle 63 tester passerer
- Test Suites: 11 passed
- Ingen breaking changes

### Framdrift
- **2025-10-14 15:30:** Startet analysearbeid
- **2025-10-14 15:35:** TDD sikkerhetsnett-tester skrevet og kjørt (grønne)
- **2025-10-14 15:40:** Påbegynte refaktorering
- **2025-10-14 16:15:** Opprettet alle 4 delmoduler med routes/controller/service
- **2025-10-14 16:30:** Oppdaterte tester til å bruke nye delmoduler
- **2025-10-14 16:45:** ✅ Alle tester passerer - Steg 1 fullført!

---

## Steg 2: Ekstraher felles SQL/DB utilities
**Status:** ⏳ Venter  
**Estimert tid:** 1-2 timer

### Mål
Lage felles utilities for:
- Transaksjonsbehandling
- Query-bygging
- Error-mapping (DB feilkoder → HTTP statuser)

### Deloppgaver
- [ ] Opprett `backend/shared/db/` mappe
- [ ] Lag `transactionHelper.js` med `withTransaction(callback)`
- [ ] Lag `queryBuilder.js` for gjenbrukbare queries (INSERT/UPDATE/DELETE)
- [ ] Lag `errorMapper.js` for PostgreSQL feilkoder
- [ ] Refaktorer eksisterende services til å bruke utilities
- [ ] Kjør backend tester
- [ ] Oppdater dokumentasjon

### Suksesskriterier
- ✅ Eliminert duplikat transaksjonskode
- ✅ Konsistent feilhåndtering
- ✅ Alle tester passerer

---

## Steg 3: Automatisk migrasjonskjøring
**Status:** ⏳ Venter  
**Estimert tid:** 2 timer

### Mål
Automatisere migrasjonsprosessen for både lokal og Heroku deployment.

### Deloppgaver
- [ ] Forbedre `backend/migrate.js` med bedre logging og feilhåndtering
- [ ] Opprett `npm run migrate` script
- [ ] Oppdater `heroku-postbuild` til å kjøre migrasjoner automatisk
- [ ] Legg til `--dry-run` for testing
- [ ] Oppdater `Docs/HEROKU_DEPLOYMENT.md` med ny prosess
- [ ] Test migrasjonsprosess lokalt
- [ ] Test på Heroku (staging hvis tilgjengelig)

### Suksesskriterier
- ✅ Migrasjoner kjører automatisk ved deploy
- ✅ Rollback-støtte ved feil
- ✅ Klar logging av migrasjonsstatus

---

## Steg 4: Standardiser DTO-er og typer
**Status:** ⏳ Venter  
**Estimert tid:** 2-3 timer

### Mål
Sikre at backend og frontend bruker identiske datastrukturer.

### Deloppgaver
- [ ] Opprett `backend/shared/types/` med TypeScript definisjonsfiler
- [ ] Definer interfaces for alle entiteter (Produksjon, Kategori, Plan, etc.)
- [ ] Opprett `frontend/src/types/` og kopier types fra backend
- [ ] Refaktorer backend responses til å bruke definerte types
- [ ] Refaktorer frontend API-kall til å bruke definerte types
- [ ] Kjør både backend og frontend tester
- [ ] Oppdater dokumentasjon

### Suksesskriterier
- ✅ Én kilde til sannhet for datastrukturer
- ✅ TypeScript-feil fanger opp uoverensstemmelser
- ✅ Alle tester passerer

---

## Steg 5: OpenAPI-kontrakt
**Status:** ⏳ Venter  
**Estimert tid:** 3-4 timer

### Mål
Genere API-dokumentasjon og typed frontend client automatisk.

### Deloppgaver
- [ ] Installer `swagger-jsdoc` og `swagger-ui-express`
- [ ] Skriv OpenAPI-dokumentasjon for alle endpoints
- [ ] Sett opp `/api-docs` endpoint i backend
- [ ] Installer `openapi-typescript-codegen` i frontend
- [ ] Generer typed API-client fra OpenAPI spec
- [ ] Refaktorer frontend til å bruke generert client
- [ ] Kjør tester
- [ ] Oppdater dokumentasjon

### Suksesskriterier
- ✅ Komplett API-dokumentasjon tilgjengelig på `/api-docs`
- ✅ Frontend bruker auto-generert, type-safe client
- ✅ Breaking changes oppdages automatisk

---

## Steg 6: Split Settings.tsx
**Status:** ⏳ Venter  
**Estimert tid:** 2 timer

### Mål
Dele opp `frontend/src/pages/Settings.tsx` (>300 linjer) i separate scene-komponenter.

### Deloppgaver
- [ ] Opprett `frontend/src/pages/settings/` mappe
- [ ] Flytt "Talenter & Kategorier" til `TalentSettings.tsx`
- [ ] Flytt "Produksjonskategorier" til `ProduksjonsKategoriSettings.tsx`
- [ ] Flytt "Brukere" til `UserSettings.tsx`
- [ ] Oppdater `Settings.tsx` til å lazy-load scene-komponenter
- [ ] Kjør frontend build (`npm run build`)
- [ ] Test alle tabs i Settings
- [ ] Oppdater dokumentasjon

### Suksesskriterier
- ✅ Ingen fil over 250 linjer
- ✅ Lazy loading fungerer
- ✅ Frontend bygger uten feil

---

## Steg 7: Gjenbrukbare UI-mønstre
**Status:** ⏳ Venter  
**Estimert tid:** 2-3 timer

### Mål
Standardisere UI-komponenter på tvers av applikasjonen.

### Deloppgaver
- [ ] Opprett `frontend/src/components/common/ListRow.tsx`
- [ ] Opprett `frontend/src/components/common/StatChip.tsx`
- [ ] Utvid `ConfirmDialog.tsx` med flere varianter (warning, error, info)
- [ ] Refaktorer eksisterende komponenter til å bruke felles mønstre
- [ ] Skriv TDD-tester for alle felles komponenter
- [ ] Kjør frontend tester
- [ ] Oppdater dokumentasjon

### Suksesskriterier
- ✅ Konsistent UI på tvers av app
- ✅ Redusert duplikat kode
- ✅ Alle tester passerer

---

## Steg 8: Service-lag + React Query
**Status:** ⏳ Venter  
**Estimert tid:** 3-4 timer

### Mål
Eliminere duplikat API-kall og forbedre caching/state management.

### Deloppgaver
- [ ] Installer `@tanstack/react-query`
- [ ] Sett opp QueryClientProvider i `App.tsx`
- [ ] Opprett `frontend/src/hooks/queries/` for custom hooks
- [ ] Migrer `useTalentData` til React Query
- [ ] Migrer `useProductionData` til React Query
- [ ] Fjern duplikat API-kall i komponenter
- [ ] Kjør frontend tester
- [ ] Oppdater dokumentasjon

### Suksesskriterier
- ✅ Automatisk caching og refetching
- ✅ Ingen duplikat API-kall
- ✅ Forbedret brukeropplevelse (raskere last)

---

## Steg 9: TDD integrasjonstester - Produksjon
**Status:** ⏳ Venter  
**Estimert tid:** 3 timer

### Mål
Dekke alle produksjon-endpoints med integrasjonstester.

### Deloppgaver
- [ ] Opprett `backend/modules/produksjon/__tests__/produksjon.integration.test.js`
- [ ] Test GET /api/produksjon (alle varianter av filtre)
- [ ] Test POST /api/produksjon (med og uten kategori, talent mal)
- [ ] Test PUT /api/produksjon/:id
- [ ] Test DELETE /api/produksjon/:id
- [ ] Kjør tester
- [ ] Oppdater testdokumentasjon

### Suksesskriterier
- ✅ >80% test coverage for produksjon-modul
- ✅ Alle edge cases dekket
- ✅ Alle tester passerer

---

## Steg 10: TDD enhetstester - Kategori-mal
**Status:** ⏳ Venter  
**Estimert tid:** 2 timer

### Mål
Teste kategori-mal funksjonalitet og dypslett grundig.

### Deloppgaver
- [ ] Opprett `backend/modules/produksjon/__tests__/kategori.test.js`
- [ ] Test CRUD for produksjonskategorier
- [ ] Test talent-mal CRUD
- [ ] Test dypslett (`deleteKategoriDeep`)
- [ ] Test edge cases (orphan templates, etc.)
- [ ] Kjør tester
- [ ] Oppdater testdokumentasjon

### Suksesskriterier
- ✅ >80% test coverage for kategori-modul
- ✅ Dypslett testet grundig
- ✅ Alle tester passerer

---

## Steg 11: CI Pipeline
**Status:** ⏳ Venter  
**Estimert tid:** 2-3 timer

### Mål
Automatisere testing og validering i CI/CD pipeline.

### Deloppgaver
- [ ] Opprett `.github/workflows/ci.yml`
- [ ] Legg til backend test job
- [ ] Legg til frontend build + test job
- [ ] Legg til migrasjon dry-run job
- [ ] Legg til linting job
- [ ] Test CI pipeline
- [ ] Oppdater dokumentasjon

### Suksesskriterier
- ✅ Alle tester kjører automatisk ved push
- ✅ PR-er blokkeres hvis tester feiler
- ✅ Migrasjoner valideres før merge

---

## Steg 12: Dokumentasjonsopprydding
**Status:** ⏳ Venter  
**Estimert tid:** 2 timer

### Mål
Sikre at all dokumentasjon er oppdatert og reflekterer faktisk tilstand.

### Deloppgaver
- [ ] Oppdater `ARCHITECTURE.md` med ny modulstruktur
- [ ] Oppdater `DATABASE.md` med alle tabeller og relasjoner
- [ ] Oppdater `MIGRATION_NOTES.md` med alle migrasjoner
- [ ] Oppdater `Docs/HEROKU_DEPLOYMENT.md` med ny migrasjonsprosess
- [ ] Oppdater `AI_WORKFLOW.md` hvis nødvendig
- [ ] Oppdater README-filer i alle moduler
- [ ] Verifiser at alt er korrekt

### Suksesskriterier
- ✅ All dokumentasjon er oppdatert
- ✅ Ingen motstridende informasjon
- ✅ Klar onboarding for nye utviklere/AI

---

## Steg 13: Navnekonsekvens-audit
**Status:** ⏳ Venter  
**Estimert tid:** 2-3 timer

### Mål
Sikre konsistent navngivning på tvers av hele applikasjonen.

### Deloppgaver
- [ ] Audit: talent vs kompetanse (velg én)
- [ ] Audit: camelCase vs snake_case konsistens
- [ ] Audit: norsk vs engelsk (velg én strategi)
- [ ] Lag migrasjon for eventuelle DB-endringer
- [ ] Refaktorer backend til konsistent navngivning
- [ ] Refaktorer frontend til konsistent navngivning
- [ ] Kjør alle tester
- [ ] Oppdater dokumentasjon

### Suksesskriterier
- ✅ Konsistent navngivning på tvers av stack
- ✅ Alle tester passerer
- ✅ Dokumentasjon oppdatert

---

## Steg 14: Ytelsesoptimalisering
**Status:** ⏳ Venter  
**Estimert tid:** 3-4 timer

### Mål
Optimalisere database og API for bedre ytelse.

### Deloppgaver
- [ ] Analyser eksisterende queries for N+1 problemer
- [ ] Legg til manglende database-indekser
- [ ] Implementer paginering for store lister
- [ ] Legg til caching-headere på statiske endepunkter
- [ ] Optimaliser frontend bundle størrelse
- [ ] Kjør ytelsestester
- [ ] Oppdater dokumentasjon

### Suksesskriterier
- ✅ Ingen N+1 queries
- ✅ Alle list-endepunkter har paginering
- ✅ Frontend bundle < 500KB gzipped
- ✅ API responstid < 200ms (p95)

---

## Vedlikeholdsinstruksjoner

### Når et steg er fullført:
1. Marker steg som ✅ Fullført
2. Oppdater overordnet status
3. Dokumenter eventuelle avvik eller læringspunkter
4. Commit endringer med referanse til REFACTOR_PLAN

### Når et steg blokkeres:
1. Marker steg som 🚫 Blokkert
2. Dokumenter blokkerende årsak
3. Opprett issue/task for å løse blokkering

### Rapportering:
- Oppdater denne filen kontinuerlig
- Tag commits med `[REFACTOR-STEP-X]`
- Oppdater ARCHITECTURE.md etter hvert steg som endrer arkitektur

---

## Notater og læringspunkter

### 2025-10-14
- Startet refaktoreringsarbeid
- Identifisert 14 steg for å nå kvalitetsmål
- Fokus: Modulær arkitektur, TDD, automatisering

