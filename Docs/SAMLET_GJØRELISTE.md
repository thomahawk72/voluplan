# 📋 SAMLET GJØRELISTE - VOLUPLAN

**Generert:** 2025-10-18  
**Basert på:** REFACTOR_PLAN.md + SIKKERHETSRAPPORT.md  
**Status:** 4/27 steg fullført (15%)

---

## 🎯 EXECUTIVE SUMMARY

### Overordnet Status

| Kategori | Fullført | Gjenstår | Total | Prosent |
|----------|----------|----------|-------|---------|
| **Refaktorering** | 1 | 17 | 18 | 6% |
| **Sikkerhet** | 3 | 6 | 9 | 33% |
| **SAMLET** | **4** | **23** | **27** | **15%** |

### Estimert Arbeidsmengde

| Prioritet | Antall steg | Estimert tid | Status |
|-----------|-------------|--------------|--------|
| 🔴 **P0 - Kritisk** | 8 steg | ~18t | 3 fullført, 5 gjenstår |
| 🟠 **P1 - Høy** | 9 steg | ~25t | 0 fullført, 9 gjenstår |
| 🟡 **P2 - Medium** | 8 steg | ~30t | 0 fullført, 8 gjenstår |
| 🔵 **P3 - Lav** | 2 steg | ~5t | 0 fullført, 2 gjenstår |
| **TOTAL** | **27 steg** | **~78 timer** | **~2 uker fulltime** |

### Risk Score

| Metrikk | Før (2025-10-18) | Etter Fiks | Forbedring |
|---------|------------------|------------|------------|
| **Sikkerhet Risk Score** | 6.5/10 (MEDIUM-HIGH) | 5.2/10 (MEDIUM) | ⬇️ -20% |
| **OWASP Compliance** | 7/10 | 8/10 | ⬆️ +14% |
| **Teknisk Gjeld** | ~78t | ~76t | ⬇️ -2t (3% redusert) |
| **Kritiske Sårbarheter** | 3 | 0 | ✅ -100% |

---

## 📅 PRIORITERT GJØRELISTE (INTEGRERT)

### 🔴 FASE 1: KRITISK PRIORITET (P0) - 18 timer

**Mål:** Eliminere alle kritiske sikkerhetssårbarheter og kodebase-problemer

| # | Steg | Type | Estimat | Status | Beskrivelse |
|---|------|------|---------|--------|-------------|
| 1 | ✅ Steg 19 (SEC-001) | Sikkerhet | 30m | **FULLFØRT** | Frontend dependencies oppdatert |
| 2 | ✅ Steg 20 (SEC-002) | Sikkerhet | 1t | **FULLFØRT** | Helmet.js security headers |
| 3 | ✅ Steg 21 (SEC-003) | Sikkerhet | 15m | **FULLFØRT** | JWT_SECRET validering |
| 4 | **Steg 22 (SEC-006)** | **Sikkerhet** | **3t** | ⏳ Venter | **Horizontal access control** |
| 5 | Steg 15 | Refaktorering | 1t | ⏳ Venter | Rydd opp ubrukt kode |
| 6 | Steg 17 | Refaktorering | 2t | ⏳ Venter | Rename kompetanse→talent |
| 7 | Steg 2 | Refaktorering | 3t | ⏳ Venter | SQL utilities (hierarki, transaksjoner, error mapping) |
| 8 | Steg 6 | Refaktorering | 2t | ⏳ Venter | Split store komponenter (EmployeeCard, Dashboard, etc.) |

**Framdrift:** ✅ 3/8 fullført (38%)  
**Gjenstående tid:** ~11 timer

---

### 🟠 FASE 2: HØY PRIORITET (P1) - 25 timer

**Mål:** Sikre applikasjonen mot vanlige angrep og forbedre kodebase-kvalitet

| # | Steg | Type | Estimat | Status | Beskrivelse |
|---|------|------|---------|--------|-------------|
| 9 | **Steg 23 (SEC-007)** | **Sikkerhet** | **1t** | ⏳ Venter | **Rate limiting på dyre operasjoner** |
| 10 | **Steg 24 (SEC-008)** | **Sikkerhet** | **2t** | ⏳ Venter | **Code review dynamiske queries (SQL injection)** |
| 11 | **Steg 25 (SEC-009)** | **Sikkerhet** | **3t** | ⏳ Venter | **CSRF token validation** |
| 12 | Steg 16 (SEC-004) | Sikkerhet/Refakt | 4t | ⏳ Venter | Input-validering (express-validator, zod) |
| 13 | Steg 12 | Refaktorering | 2t | ⏳ Venter | Dokumentasjonsopprydding |
| 14 | Steg 8 | Refaktorering | 4t | ⏳ Venter | React Query (state management) |
| 15 | Steg 18 | Refaktorering | 5t | ⏳ Venter | Frontend testing infrastructure |
| 16 | Steg 3 | Refaktorering | 2t | ⏳ Venter | Automatisk migrasjonskjøring |
| 17 | Steg 9 | Refaktorering | 3t | ⏳ Venter | TDD integrasjonstester - Produksjon |

**Framdrift:** 0/9 fullført (0%)  
**Gjenstående tid:** 25 timer

---

### 🟡 FASE 3: MEDIUM PRIORITET (P2) - 30 timer

**Mål:** Herde applikasjonen og forbedre utvikler-opplevelse

| # | Steg | Type | Estimat | Status | Beskrivelse |
|---|------|------|---------|--------|-------------|
| 18 | Steg 26 (SEC-010 til SEC-017) | Sikkerhet | 10t | ⏳ Venter | Medium sikkerhetstiltak (8 stk) |
| 19 | Steg 4 | Refaktorering | 3t | ⏳ Venter | Standardiser DTO-er og typer |
| 20 | Steg 5 | Refaktorering | 4t | ⏳ Venter | OpenAPI-kontrakt |
| 21 | Steg 7 | Refaktorering | 3t | ⏳ Venter | Gjenbrukbare UI-mønstre |
| 22 | Steg 10 | Refaktorering | 2t | ⏳ Venter | TDD enhetstester - Kategori-mal |
| 23 | Steg 11 | Refaktorering | 3t | ⏳ Venter | CI Pipeline |
| 24 | Steg 13 | Refaktorering | 3t | ⏳ Venter | Navnekonsekvens-audit |
| 25 | Steg 14 | Refaktorering | 4t | ⏳ Venter | Ytelsesoptimalisering |

**Framdrift:** 0/8 fullført (0%)  
**Gjenstående tid:** 30 timer

---

### 🔵 FASE 4: LAV PRIORITET (P3) - 5 timer

**Mål:** Best practices og nice-to-have forbedringer

| # | Steg | Type | Estimat | Status | Beskrivelse |
|---|------|------|---------|--------|-------------|
| 26 | Steg 27 (SEC-018 til SEC-022) | Sikkerhet | 5t | ⏳ Venter | Lave sikkerhetstiltak (5 stk) |

**Framdrift:** 0/1 fullført (0%)  
**Gjenstående tid:** 5 timer

---

## 🎯 ANBEFALTE WORK SPRINTS

### Sprint 1: KRITISK SIKKERHET (1 dag)
✅ **FULLFØRT 2025-10-18**
- ✅ SEC-001: Frontend dependencies (30m)
- ✅ SEC-002: Helmet.js (1t)
- ✅ SEC-003: JWT_SECRET validering (15m)

**Resultat:** Alle kritiske sårbarheter eliminert! Risk score redusert fra 6.5 → 5.2

---

### Sprint 2: ACCESS CONTROL & KODE-OPPRYDDING (1 dag)
⏳ **NESTE PRIORITET**
- **SEC-006**: Horizontal access control (3t) 🔴 KRITISK
- Steg 15: Rydd opp ubrukt kode (1t)
- Steg 17: Rename kompetanse→talent (2t)
- Steg 2: SQL utilities (3t)

**Estimert:** ~9 timer (1 arbeidsdag)

---

### Sprint 3: KOMPONENTER & VALIDERING (1.5 dag)
- Steg 6: Split store komponenter (2t)
- **SEC-007**: Rate limiting (1t)
- **SEC-008**: SQL injection review (2t)
- **SEC-009**: CSRF tokens (3t)
- Steg 16: Input-validering (4t)

**Estimert:** ~12 timer (1.5 arbeidsdag)

---

### Sprint 4: STATE MANAGEMENT & TESTING (1.5 dag)
- Steg 12: Dokumentasjon (2t)
- Steg 8: React Query (4t)
- Steg 18: Frontend testing (5t)

**Estimert:** ~11 timer (1.5 arbeidsdag)

---

### Sprint 5+: HARDENING & BEST PRACTICES (2 uker)
- Alle P2 og P3 steg
- Total: ~35 timer

---

## 📊 DETALJERT SAMMENDRAG

### Refaktorerings-Problemer Identifisert

| Kategori | P0 | P1 | P2 | Total |
|----------|----|----|----|----|
| **Duplikat kode** | 1 | 0 | 0 | 1 |
| **Ubrukt/farlig kode** | 1 | 0 | 0 | 1 |
| **Store komponenter** | 1 | 0 | 0 | 1 |
| **Navngivning** | 1 | 0 | 1 | 2 |
| **Dokumentasjon** | 0 | 1 | 0 | 1 |
| **State management** | 0 | 1 | 0 | 1 |
| **Validering** | 0 | 1 | 0 | 1 |
| **Testing** | 0 | 1 | 0 | 1 |
| **Arkitektur** | 0 | 2 | 5 | 7 |
| **TOTAL** | **4** | **6** | **6** | **16** |

### Sikkerhetssårbarheter Identifisert

| Kategori | Kritisk | Høy | Medium | Lav | Total |
|----------|---------|-----|--------|-----|-------|
| **Vulnerable Components** | 1 ✅ | 1 | 0 | 0 | 2 |
| **Security Misconfiguration** | 1 ✅ | 0 | 2 | 2 | 5 |
| **Authentication Failures** | 1 ✅ | 0 | 2 | 1 | 4 |
| **Broken Access Control** | 0 | 2 | 0 | 0 | 2 |
| **Injection** | 0 | 2 | 0 | 0 | 2 |
| **Insecure Design** | 0 | 1 | 2 | 0 | 3 |
| **Logging Failures** | 0 | 0 | 1 | 0 | 1 |
| **Cryptographic Failures** | 0 | 0 | 1 | 1 | 2 |
| **TOTAL** | **3 ✅** | **6** | **8** | **5** | **22** |

---

## 🚀 NESTE STEG (KONKRET HANDLINGSPLAN)

### I DAG / I MORGEN:
1. ✅ ~~Deploy endringer til Heroku~~
2. ✅ ~~Generer og sett sterkt JWT_SECRET på Heroku~~
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   heroku config:set JWT_SECRET="<generated-secret>"
   ```
3. **START Sprint 2:** Implementer horizontal access control (SEC-006)

### DENNE UKEN:
- Sprint 2: Access control & kode-opprydding (1 dag)
- Sprint 3: Komponenter & validering (1.5 dag)
- Sprint 4: State management & testing (1.5 dag)

### DENNE MÅNEDEN:
- Sprint 5+: Hardening & best practices (resterende)

---

## 📈 PROGRESS TRACKING

### Fullførte Steg (4/27)

| Steg | Navn | Tid | Dato | Notater |
|------|------|-----|------|---------|
| 1 | Produksjon-modul refaktorering | 2t | 2025-10-14 | 4 delmoduler, 63 tester grønne |
| 19 | Frontend dependencies (SEC-001) | 30m | 2025-10-18 | 9→3 vulnerabilities |
| 20 | Helmet.js (SEC-002) | 1t | 2025-10-18 | Alle security headers |
| 21 | JWT_SECRET validering (SEC-003) | 15m | 2025-10-18 | Production validering |

**Total tid brukt:** 3.75 timer  
**Gjenstående tid:** ~74 timer

---

## 📚 REFERANSER

- **REFACTOR_PLAN.md** - Detaljert refaktoreringsplan (Steg 1-18)
- **SIKKERHETSRAPPORT.md** - Fullstendig sikkerhetsaudit (SEC-001 til SEC-022)
- **ARCHITECTURE.md** - Systemarkitektur
- **DATABASE.md** - Database schema
- **SECURITY.md** - Sikkerhetstiltak implementert

---

**Sist oppdatert:** 2025-10-18  
**Ansvarlig:** Cursor AI (Claude Sonnet 4.5)  
**Status:** ✅ Alle kritiske sårbarheter fikset! 🎉

