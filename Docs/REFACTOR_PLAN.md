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

## 📊 KODEBASE-ANALYSE (2025-10-18)

### Metodikk
Gjennomført omfattende analyse av hele kodebasen:
- ✅ Alle backend-filer gjennomgått linje-for-linje
- ✅ Alle frontend-komponenter analysert
- ✅ Dokumentasjon verifisert mot faktisk kode
- ✅ Tester evaluert for dekning og kvalitet
- ✅ Dependencies gjennomgått for sikkerhet og versjon

### 🔴 KRITISKE FUNN (P0 - Må fikses umiddelbart)

**1. DUPLIKAT KODE - TALENT HIERARKI QUERY**
- **Lokasjon:** `backend/modules/kompetanse/service.js` (3x), `backend/modules/bruker/service.js` (3x), `backend/modules/produksjon/kategori/service.js` (1x)
- **Problem:** 90+ linjer identisk SQL for 3-nivå talent-hierarki
- **Impact:** Vedlikeholdsmareritt, feil må fikses 7 steder
- **Løsning:** Steg 2 (SQL utilities) → `shared/db/queryFragments.js`

**2. UBRUKT/FARLIG KODE**
- **Lokasjon:** `backend/modules/kompetanse/service.js:264-299`
- **Problem:** `findByUserId` og `findUsersByKompetanseId` refererer til tabeller som ikke eksisterer (`kompetanse`, `kompetansekategori`)
- **Impact:** Krasjer hvis kalles. Latent bug.
- **Løsning:** Slett funksjonene eller refaktorer til nye tabellnavn

**3. STORE KOMPONENTER - BRYTER ARKITEKTURREGLER**
- `EmployeeCard.tsx`: **627 linjer** (over dobbelt grense!)
- `Dashboard.tsx`: **445 linjer**
- `Settings.tsx`: **397 linjer**
- `ProduksjonsKategoriMal.tsx`: **389 linjer**
- **Problem:** Uoversiktlig, vanskelig å teste, dårlig vedlikeholdbarhet
- **Løsning:** Steg 6-7 (Split komponenter)

**4. NAVNGIVNING KAOS**
- Database: `talent`, `talentkategori` ✅
- Backend modul: `modules/kompetanse/` ❌
- Backend API: `/api/kompetanse` ❌
- Frontend: `talentAPI` ✅
- Dokumentasjon: Blandet "Talent" og "Kompetanse" ❌
- **Impact:** Forvirrende for AI og utviklere
- **Løsning:** Steg 13 (Navnekonsekvens-audit) → Velg ÉN term

### 🟡 ALVORLIGE MANGLER (P1 - Fikses innen 2 uker)

**5. DOKUMENTASJON ≠ KODE**
- `DATABASE.md` sier `sertifisert` felt er fjernet, men `schema.sql` har det fortsatt
- `ARCHITECTURE.md` dokumenterer flat `kompetanse` modul, ikke refaktorert struktur
- `DATABASE.md:264-277` refererer til `kompetanse`/`kompetansekategori` tabeller som ikke finnes
- **Løsning:** Steg 12 (Dokumentasjonsopprydding)

**6. INGEN STATE MANAGEMENT**
- Hver komponent fetcher sine egne data
- Ingen caching (samme data fetches mange ganger)
- Ingen optimistic updates
- Duplikat loading/error state-håndtering i 15+ komponenter
- **Impact:** Dårlig UX, tregere app, mer kode
- **Løsning:** Steg 8 (React Query)

**7. INGEN VALIDERING**
- `express-validator` installert men ikke brukt
- Ingen input-validering på backend routes
- Ingen Zod/Yup på frontend
- **Impact:** Dårlige feilmeldinger, potensielle bugs
- **Løsning:** Nytt steg - Legg til validering

**8. INGEN TRANSAKSJONSHELPER**
- Transaksjonslogikk duplisert manuelt
- `BEGIN/COMMIT/ROLLBACK` spredt i koden
- **Løsning:** Steg 2 (SQL utilities)

**9. INGEN ERROR MAPPING**
- PostgreSQL errors blir ikke mappet til HTTP-statuser
- FK violation → 500 i stedet for 400/409
- **Løsning:** Steg 2 (SQL utilities)

### 🟢 FORBEDRINGSMULIGHETER (P2 - Nice to have)

**10. INGEN LAZY LOADING**
- Settings tabs lastes alle samtidig
- Ingen code splitting
- **Impact:** Større bundle, tregere første lasting
- **Løsning:** Steg 6 (Split komponenter) + lazy loading

**11. MANGLENDE FELLES UI-KOMPONENTER**
- Ingen `<StatusChip>`, `<DataTable>`, `<FormField>`, `<LoadingState>`
- Status-styling duplisert 5+ steder
- **Løsning:** Steg 7 (Gjenbrukbare UI-mønstre)

**12. INGEN FRONTEND TESTER**
- Coverage: ~0%
- Kun 2 placeholder-tester
- **Impact:** Ingen sikkerhetsnett mot regresjoner
- **Løsning:** Nytt steg - Frontend testing

**13. API.TS FOR STOR**
- 526 linjer i én fil
- **Løsning:** Steg 4 (Split API-client)

**14. INGEN OPENAPI/SWAGGER**
- API docs kun i markdown
- Ingen auto-generated client
- **Løsning:** Steg 5 (OpenAPI)

### 📈 METRIKER

**Backend:**
- **Tester:** 63/63 passerer ✅
- **Test Suites:** 11 passed ✅
- **Coverage:** ~70% (estimert) ⚠️
- **Største fil:** `kategori/service.js` (219 linjer) ✅
- **Duplikat kode:** ~15% (estimert) ❌

**Frontend:**
- **Tester:** 0 reelle tester ❌
- **Coverage:** 0% ❌
- **Største fil:** `EmployeeCard.tsx` (627 linjer) ❌
- **TypeScript errors:** 0 ✅
- **Bundle size:** Ukjent, men sannsynligvis stor ⚠️

**Teknisk gjeld (estimert tid for å fikse alt):**
- P0 (Kritisk): **~8-12 timer**
- P1 (Alvorlig): **~16-24 timer**
- P2 (Forbedring): **~12-16 timer**
- **Total:** ~36-52 timer (~1-1.5 uker fulltime)

---

## Overordnet Status

**Sist oppdatert:** 2025-10-18 (Sprint 2 delvis fullført)

- ✅ **Fullført:** 6/27 steg (22%)
  - Steg 1: Produksjon-modul refaktorering
  - Steg 15: Rydd opp ubrukt/farlig kode ⭐️ NYT!
  - Steg 19: Frontend dependencies (SEC-001)
  - Steg 20: Helmet.js security headers (SEC-002)
  - Steg 21: JWT_SECRET validering (SEC-003)
  - Steg 22: Horizontal Access Control (SEC-006) 🔒 KRITISK!
- 🚧 **Pågående:** 0/27 steg
- ⏳ **Venter:** 21/27 steg
- **🆕 Nye steg identifisert:** 13 steg (15-27) inkl. 9 sikkerhetssteg

### 🎯 SAMLET PRIORITERT REKKEFØLGE (Refaktorering + Sikkerhet):

**🔴 KRITISK PRIORITET (P0) - Må fikses nå (18t totalt):**
1. ✅ ~~**Steg 19** (SEC-001) - Frontend dependencies (30m)~~ **FULLFØRT 2025-10-18**
2. ✅ ~~**Steg 20** (SEC-002) - Helmet.js security headers (1t)~~ **FULLFØRT 2025-10-18**
3. ✅ ~~**Steg 21** (SEC-003) - JWT_SECRET validering (15m)~~ **FULLFØRT 2025-10-18**
4. ✅ ~~**Steg 22** (SEC-006) - Horizontal access control (1.5t)~~ **FULLFØRT 2025-10-18** 🔒
5. ✅ ~~**Steg 15** - Rydd opp ubrukt kode (30m)~~ **FULLFØRT 2025-10-18**
6. **Steg 17** - Rename kompetanse→talent (2t) ⏳ NESTE
7. **Steg 2** - SQL utilities (3t)
8. **Steg 6** - Split store komponenter (2t)

**🟠 HØY PRIORITET (P1) - Fiks innen 1 uke (25t totalt):**
9. **Steg 23** (SEC-007) - Rate limiting på dyre operasjoner (1t) 🆕
10. **Steg 24** (SEC-008) - Code review dynamiske queries (2t) 🆕
11. **Steg 25** (SEC-009) - CSRF token validation (3t) 🆕
12. **Steg 16** (SEC-004) - Input-validering (4t)
13. **Steg 12** - Dokumentasjonsopprydding (2t)
14. **Steg 8** - React Query (4t)
15. **Steg 18** - Frontend testing (5t)
16. **Steg 3** - Automatisk migrasjonskjøring (2t)
17. **Steg 9** - TDD integrasjonstester Produksjon (3t)

**🟡 MEDIUM PRIORITET (P2) - Fiks innen 1 måned (30t totalt):**
18. **Steg 26** (SEC-010 til SEC-017) - Medium sikkerhetstiltak (10t) 🆕
19. **Steg 4** - Standardiser DTO-er og typer (3t)
20. **Steg 5** - OpenAPI-kontrakt (4t)
21. **Steg 7** - Gjenbrukbare UI-mønstre (3t)
22. **Steg 10** - TDD enhetstester Kategori-mal (2t)
23. **Steg 11** - CI Pipeline (3t)
24. **Steg 13** - Navnekonsekvens-audit (3t)
25. **Steg 14** - Ytelsesoptimalisering (4t)

**🔵 LAV PRIORITET (P3) - Best practice (5t totalt):**
26. **Steg 27** (SEC-018 til SEC-022) - Lave sikkerhetstiltak (5t) 🆕

**📊 TOTAL ESTIMERT TID:** ~78 timer (~2 uker fulltime)

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
**Estimert tid:** 2-3 timer  
**Prioritet:** 🔴 P0 (Kritisk - fikser 3 store problemer)

### Mål
Lage felles utilities for:
- **Talent hierarki-queries** (duplisert 7 steder!)
- Transaksjonsbehandling
- Error-mapping (DB feilkoder → HTTP statuser)

### Deloppgaver
- [ ] Opprett `backend/shared/db/` mappe
- [ ] **Lag `queryFragments.js` med `getTalentHierarchyColumns()` og `getTalentHierarchyJoins()`**
  - Erstatter 90+ linjer duplisert SQL
  - Brukes i: kompetanse/service.js, bruker/service.js, produksjon/kategori/service.js
- [ ] Lag `transactionHelper.js` med `withTransaction(callback)`
  - Erstatter manuell BEGIN/COMMIT/ROLLBACK i kategori/service.js
- [ ] Lag `errorMapper.js` for PostgreSQL feilkoder
  - FK constraint violation (23503) → 400 Bad Request
  - Unique constraint violation (23505) → 409 Conflict
  - Not null violation (23502) → 400 Bad Request
  - Foreign key not found (23503) → 404 Not Found
- [ ] Refaktorer eksisterende services til å bruke utilities
  - kompetanse/service.js: `findAll`, `findById`, `findByUserId`
  - bruker/service.js: `findUserTalents`, `findAllWithTalents`
  - produksjon/kategori/service.js: `findTalentMalByKategoriId`
- [ ] Kjør backend tester (forvent alle 63 å passere)
- [ ] Oppdater dokumentasjon

### Suksesskriterier
- ✅ Talent-hierarki query finnes KUN i queryFragments.js
- ✅ Alle services bruker felles funksjoner
- ✅ Eliminert ~90 linjer duplikat kode
- ✅ PostgreSQL errors mappes til korrekte HTTP-statuser
- ✅ Transaksjoner bruker felles helper
- ✅ Alle tester passerer (63/63)

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

## 🆕 NYE STEG (Identifisert 2025-10-18)

## Steg 15: Rydd opp i ubrukt/farlig kode
**Status:** ✅ Fullført (2025-10-18)
**Faktisk tid:** 30 minutter  
**Prioritet:** 🔴 P0 (Kritisk - latent bug)

### Mål
Fjerne kode som refererer til tabeller/strukturer som ikke eksisterer lenger.

### Deloppgaver
- [x] ✅ **SLETTET `findByUserId` og `findUsersByKompetanseId` i `kompetanse/service.js`**
  - Refererte til `kompetanse` og `kompetansekategori` tabeller som ikke finnes
  - Ville krasjet hvis kalt
- [x] ✅ Fjernet controller-funksjoner `getByUserId` og `getUsersByKompetanseId`
- [x] ✅ Fjernet API routes: `GET /api/kompetanse/bruker/:userId` og `GET /api/kompetanse/:id/brukere`
- [x] ✅ Sjekket alle imports og avhengigheter til slettede funksjoner
- [x] ✅ Kjørt backend tester (119/119 passerer)
- [x] ✅ Oppdatert dokumentasjon (SECURITY.md)
- [ ] ⏳ Fjern deprecated schema fields (utsatt til senere)

### Suksesskriterier
- ✅ Ingen referanser til ikke-eksisterende tabeller
- ✅ Alle tester passerer (119/119)
- ✅ Ingen import-feil
- ⏳ Schema opprydding (utsatt)

---

## Steg 16: Legg til Input-validering
**Status:** ⏳ Venter  
**Estimert tid:** 3-4 timer  
**Prioritet:** 🟡 P1 (Alvorlig)

### Mål
Implementere robust input-validering på både backend og frontend.

### Deloppgaver
**Backend:**
- [ ] Legg til `express-validator` middleware i alle POST/PUT routes
- [ ] Valider alle endpoints i bruker/routes.js
- [ ] Valider alle endpoints i kompetanse/routes.js
- [ ] Valider alle endpoints i produksjon/routes.js (alle delmoduler)
- [ ] Legg til felles validerings-schemas i `shared/validation/`

**Frontend:**
- [ ] Installer `zod` eller `yup` for schema-validering
- [ ] Installer `react-hook-form` for form-håndtering
- [ ] Refaktorer dialogs til å bruke react-hook-form + zod
- [ ] Legg til felles validerings-schemas i `utils/validation/`

- [ ] Kjør backend tester
- [ ] Test frontend forms manuelt
- [ ] Oppdater dokumentasjon

### Suksesskriterier
- ✅ Alle backend routes har input-validering
- ✅ Konsistente feilmeldinger fra backend
- ✅ Frontend-forms validerer før sending
- ✅ Alle tester passerer

---

## Steg 17: Rename kompetanse → talent
**Status:** ⏳ Venter  
**Estimert tid:** 2 timer  
**Prioritet:** 🔴 P0 (Kritisk - navnekonsekvens)

### Mål
Gjøre navngivning konsistent på tvers av hele stacken.

### Deloppgaver
- [ ] Rename `backend/modules/kompetanse/` → `backend/modules/talent/`
- [ ] Endre API-rute `/api/kompetanse` → `/api/talent`
- [ ] Oppdater alle imports i backend
- [ ] Oppdater frontend API-kall fra `/api/kompetanse` → `/api/talent`
- [ ] Oppdater ARCHITECTURE.md
- [ ] Oppdater DATABASE.md
- [ ] Oppdater alle README-filer
- [ ] Kjør backend tester
- [ ] Kjør frontend build
- [ ] Test manuelt

### Suksesskriterier
- ✅ Konsistent bruk av "talent" overalt
- ✅ Ingen "kompetanse" i API-ruter
- ✅ Ingen "kompetanse" i modulnavn
- ✅ Dokumentasjon er konsistent
- ✅ Alle tester passerer

---

## Steg 18: Frontend Testing Infrastructure
**Status:** ⏳ Venter  
**Estimert tid:** 4-6 timer  
**Prioritet:** 🟡 P1 (Alvorlig)

### Mål
Etablere test-infrastruktur og skrive tester for kritiske komponenter.

### Deloppgaver
- [ ] Sett opp React Testing Library ordentlig
- [ ] Installer `@testing-library/user-event`
- [ ] Opprett mock-data utilities i `__tests__/fixtures/`
- [ ] Skriv tester for:
  - `AuthContext` (real test, ikke placeholder)
  - `TalentTree` (real test)
  - `useProductionData` hook
  - `useTalentData` hook
  - `EmployeeCard` (de viktigste delene)
- [ ] Sett opp coverage-rapportering
- [ ] Legg til `npm run test:coverage` script
- [ ] Kjør alle tester
- [ ] Dokumenter testing best practices

### Suksesskriterier
- ✅ Minst 10 reelle tester
- ✅ Coverage > 30% (start-mål)
- ✅ CI-pipeline kan kjøre tester
- ✅ Alle tester passerer

---

---

## 🔒 SIKKERHETSSTEG (Steg 19-27)

## Steg 19: Frontend Dependencies (SEC-001)
**Status:** ✅ Fullført (2025-10-18)
**Faktisk tid:** 30 minutter  
**Prioritet:** 🔴 P0 (Kritisk)  
**OWASP:** A06:2021 - Vulnerable and Outdated Components

### Mål
Fikse 6 HIGH + 3 MODERATE severity vulnerabilities i frontend dependencies.

### Resultat
✅ Redusert fra 9 vulnerabilities til 3 MODERATE (kun dev-miljø)
- La til npm overrides for `nth-check`, `postcss`, `webpack-dev-server`
- Alle 3 gjenstående sårbarheter er kun i dev-miljø (webpack-dev-server)
- Frontend bygger perfekt

---

## Steg 20: Helmet.js Security Headers (SEC-002)
**Status:** ✅ Fullført (2025-10-18)
**Faktisk tid:** 1 time  
**Prioritet:** 🔴 P0 (Kritisk)  
**OWASP:** A05:2021 - Security Misconfiguration

### Mål
Implementere kritiske HTTP security headers.

### Resultat
✅ Helmet.js installert og konfigurert
- Content-Security-Policy (CSP)
- Strict-Transport-Security (HSTS) - 1 år
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Alle 110 backend tester passerer

---

## Steg 21: JWT_SECRET Production Validering (SEC-003)
**Status:** ✅ Fullført (2025-10-18)
**Faktisk tid:** 15 minutter  
**Prioritet:** 🔴 P0 (Kritisk)  
**OWASP:** A07:2021 - Identification and Authentication Failures

### Mål
Forhindre at applikasjonen starter med svake JWT secrets i production.

### Resultat
✅ Validering implementert i `envValidator.js`
- Blokkerer kjente svake secrets
- Krever minimum 32 tegn i production
- Gir tydelig feilmelding med instruksjoner
- Alle tester passerer (6/6)

---

## Steg 22: Horizontal Access Control (SEC-006)
**Status:** ✅ Fullført (2025-10-18)
**Faktisk tid:** 1.5 timer  
**Prioritet:** 🔴 P0 (Kritisk)  
**OWASP:** A01:2021 - Broken Access Control  
**CVSS Score:** 7.5 (HIGH)

### Mål
Implementere horizontal access control på alle ressurs-endepunkter.

### Problem
Mange endpoints mangler sjekk om bruker har tilgang til den spesifikke ressursen:
```javascript
// Eksempel: bruker/controller.js - get()
const get = async (req, res) => {
  const { id } = req.params;
  const user = await service.findById(id);
  // ❌ Enhver innlogget bruker kan se andre brukeres data
  res.json({ user });
};
```

### Deloppgaver
- [x] ✅ **Lag felles middleware `checkResourceOwnership(paramName, resourceType)`**
  - Implementert i `shared/middleware/auth.js`
  - Admin kan aksessere alt, user kun egne ressurser
- [x] ✅ **Bruker-endpoints:** Kun admin eller egen bruker kan se/endre brukerdata
  - GET /api/users/:id
  - PUT /api/users/:id
  - GET /api/users/:id/talents
- [x] ✅ **Produksjon-endpoints:** Sjekk bruker-tilhørighet
  - GET /api/produksjon/bruker/:userId
- [x] ✅ **Skriv tester for horizontal access control**
  - 9 nye tester i `__tests__/middleware/horizontalAccessControl.test.js`
  - Alle tester passerer
- [x] ✅ **Fiks integrasjonstester**
  - Oppdatert mocks i `plans.safety.test.js` og `routes.integration.test.js`
- [x] ✅ **Kjør alle tester** - 119/119 passerer!
- [x] ✅ **Oppdater dokumentasjon** - SECURITY.md oppdatert

### Suksesskriterier
- ✅ Ingen bruker kan se/endre andres data
- ✅ GDPR-compliant
- ✅ Alle tester passerer (119/119)
- ✅ 403 Forbidden ved uautorisert tilgang
- ✅ Uautoriserte forsøk logges

---

## Steg 23: Rate Limiting på Dyre Operasjoner (SEC-007)
**Status:** ⏳ Venter  
**Estimert tid:** 1 time  
**Prioritet:** 🟠 P1 (Høy)  
**OWASP:** A04:2021 - Insecure Design  
**CVSS Score:** 6.5 (MEDIUM)

### Mål
Legg til strengere rate limiting på ressurskrevende operasjoner.

### Deloppgaver
- [ ] Opprett `createMutationLimiter()` i `rateLimiter.js` (20 requests/15 min)
- [ ] Legg til på bulk-delete endpoints
- [ ] Legg til på produksjonsopprettelse
- [ ] Legg til på bulk-update endpoints
- [ ] Test rate limiting
- [ ] Oppdater dokumentasjon

### Suksesskriterier
- ✅ Maks 20 mutations per 15 min per bruker
- ✅ 429 Too Many Requests response
- ✅ Beskytter mot DoS

---

## Steg 24: Code Review Dynamiske Queries (SEC-008)
**Status:** ⏳ Venter  
**Estimert tid:** 2 timer  
**Prioritet:** 🟠 P1 (Høy)  
**OWASP:** A03:2021 - Injection  
**CVSS Score:** 8.2 (HIGH)

### Mål
Verifiser at ingen SQL injection er mulig i dynamiske queries.

### Deloppgaver
- [ ] Audit alle steder med dynamic query building
  - `kompetanse/service.js:findAll()`
  - `bruker/service.js:findAll()`
  - `produksjon/service.js:findAll()`
- [ ] Implementer whitelist for sortBy/orderBy parametre
- [ ] Implementer whitelist for filter-felter
- [ ] Skriv tester som prøver SQL injection
- [ ] Kjør tester
- [ ] Dokumenter safe query patterns

### Suksesskriterier
- ✅ Alle dynamiske deler har whitelist
- ✅ SQL injection tester feiler trygt
- ✅ Code review godkjent

---

## Steg 25: CSRF Token Validation (SEC-009)
**Status:** ⏳ Venter  
**Estimert tid:** 3 timer  
**Prioritet:** 🟠 P1 (Høy)  
**OWASP:** A01:2021 - Broken Access Control  
**CVSS Score:** 6.5 (MEDIUM)

### Mål
Implementere CSRF token validering på alle state-changing endpoints.

### Deloppgaver
**Backend:**
- [ ] Konfigurer `csurf` middleware
- [ ] Legg til GET /api/csrf-token endpoint
- [ ] Beskytt alle POST/PUT/DELETE/PATCH routes
- [ ] Test CSRF protection

**Frontend:**
- [ ] Lag axios interceptor for CSRF token
- [ ] Fetch CSRF token før state-changing requests
- [ ] Test at requests fungerer
- [ ] Test at requests uten token blokkeres

- [ ] Kjør alle tester
- [ ] Oppdater dokumentasjon

### Suksesskriterier
- ✅ CSRF token kreves for alle mutations
- ✅ 403 Forbidden uten gyldig token
- ✅ Beskytter mot CSRF attacks

---

## Steg 26: Medium Sikkerhetstiltak (SEC-010 til SEC-017)
**Status:** ⏳ Venter  
**Estimert tid:** 10 timer  
**Prioritet:** 🟡 P2 (Medium)

### Omfatter følgende tiltak:

**SEC-010: Account Lockout (2t)**
- Legg til `failed_login_attempts` og `locked_until` i users tabell
- Implementer lockout-logikk i login controller
- Test account lockout

**SEC-011: Audit Logging (2t)**
- Installer winston
- Strukturert logging av sikkerhetshendelser
- Log feilede logins, admin-handlinger, passordendringer

**SEC-012: Styrk Password Policy (1t)**
- Installer zxcvbn
- Krev password strength score ≥ 3
- Test password validering

**SEC-013: 2FA Support (3t)**
- Installer speakeasy + qrcode
- Implementer TOTP 2FA
- Lag frontend for QR code scanning

**SEC-014: Fix Email Enumeration (30m)**
- Returner generisk melding i forgot-password
- Ikke avslør om email eksisterer

**SEC-015: Database SSL (30m)**
- Legg til SSL config i database.js
- Test SSL connection

**SEC-016: Frontend CSP (30m)**
- Legg til CSP meta-tag i index.html
- Test CSP

**SEC-017: Secrets Manager (30m)**
- Dokumenter bruk av Heroku Config Vars
- Vurder AWS Secrets Manager for fremtiden

---

## Steg 27: Lave Sikkerhetstiltak (SEC-018 til SEC-022)
**Status:** ⏳ Venter  
**Estimert tid:** 5 timer  
**Prioritet:** 🔵 P3 (Lav - Best Practice)

### Omfatter følgende tiltak:

**SEC-018: IP Whitelisting for Admin (1t)**
- Implementer IP filter for admin endpoints
- Test IP whitelisting

**SEC-019: Security.txt (30m)**
- Lag `/.well-known/security.txt`
- Dokumenter responsible disclosure

**SEC-020: Synkroniser Cookie/JWT Expiry (1t)**
- Fiks inkonsistent expiry (JWT 7d vs cookie 8t)
- Test session handling

**SEC-021: Subresource Integrity (1t)**
- Legg til SRI hashes for CDN resources
- Test SRI

**SEC-022: Reduser Password Reset Lifetime (30m)**
- Endre fra 1 time til 30 minutter
- Test password reset flow

---

## Notater og læringspunkter

### 2025-10-18 (Sikkerhet)
- **Gjennomført fullstendig sikkerhetsaudit**
- Identifisert 22 sikkerhetssårbarheter (3 kritiske, 6 høye, 8 medium, 5 lave)
- Fikset 3 kritiske sårbarheter samme dag (SEC-001, SEC-002, SEC-003)
- Integrert sikkerhetstiltak i refaktoreringsplan (9 nye steg: 19-27)
- **Total teknisk gjeld nå:** ~78 timer (~2 uker fulltime)
- Største sikkerhetshuller:
  - Manglende horizontal access control (kritisk)
  - Inconsistent input validering
  - Ingen CSRF token validation
  - Manglende rate limiting på dyre operasjoner
  - Potensielle SQL injection-punkter

### 2025-10-18 (Refaktorering)
- **Gjennomført omfattende kodebase-analyse**
- Identifisert 4 nye kritiske steg (15-18)
- Funnet 14 kategoriserte problemer (4x P0, 5x P1, 5x P2)
- Estimert teknisk gjeld: ~36-52 timer (1-1.5 uker fulltime)
- Største funn:
  - Duplikat SQL-kode (90+ linjer)
  - 4 komponenter over 300 linjer
  - Ubrukt kode som refererer til ikke-eksisterende tabeller
  - Navngivning kaos (kompetanse vs talent)
  - Ingen validering eller state management

### 2025-10-14
- Startet refaktoreringsarbeid
- Identifisert 14 steg for å nå kvalitetsmål
- Fokus: Modulær arkitektur, TDD, automatisering

