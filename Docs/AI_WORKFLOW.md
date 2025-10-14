# AI Workflow Checklist - Voluplan

## 🎯 Denne filen forteller AI hva som MÅ gjøres hver gang

### ABSOLUTT KRAV - INGEN UNNTAK

#### 1️⃣ TESTING (OBLIGATORISK)
```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm run build
```
**Resultat:** Alle tester MÅ passere (grønn ✅)

#### 2️⃣ DOKUMENTASJON (OBLIGATORISK)
Ved **ENHVER** endring, oppdater relevante filer:

| Hvis du endrer... | Oppdater... |
|-------------------|-------------|
| Database schema | `DATABASE.md` + migrasjonsfil |
| API endpoints | `ARCHITECTURE.md` |
| Tabellnavn | `DATABASE.md` + `MIGRATION_NOTES.md` |
| Nye moduler | `ARCHITECTURE.md` |
| Breaking changes | `MIGRATION_NOTES.md` |

#### 3️⃣ STANDARD WORKFLOW

```
┌─────────────────────────────────────────────┐
│ 1. Les oppgaven og eksisterende kode       │
├─────────────────────────────────────────────┤
│ 2. Lag TODO liste (hvis komplekst >3 steg) │
├─────────────────────────────────────────────┤
│ 3. Implementer endringer                    │
├─────────────────────────────────────────────┤
│ 4. Oppdater/lag tester                      │
├─────────────────────────────────────────────┤
│ 5. ✅ KJØR npm test                         │
├─────────────────────────────────────────────┤
│ 6. ✅ KJØR npm run build                    │
├─────────────────────────────────────────────┤
│ 7. ✅ OPPDATER dokumentasjon                │
├─────────────────────────────────────────────┤
│ 8. ✅ SJEKK terminal logs                   │
├─────────────────────────────────────────────┤
│ 9. ✅ START servere og verifiser            │
├─────────────────────────────────────────────┤
│ 10. Oppsummer hva som er gjort              │
└─────────────────────────────────────────────┘
```

#### 4️⃣ "FERDIG" DEFINISJON

**Du er IKKE ferdig før:**
- ✅ `npm test` passerer (backend)
- ✅ `npm run build` passerer (frontend)
- ✅ Backend starter uten feil
- ✅ Dokumentasjon er oppdatert
- ✅ Terminal logs er sjekket
- ✅ Migrasjoner er testet (hvis database endres)

#### 5️⃣ FEILHÅNDTERING

```bash
# VED FEIL:
1. Les faktisk feilmelding - IKKE gjett!
2. Sjekk logs: tail -50 /tmp/backend.log
3. Kjør tester: npm test
4. Fiks feilen
5. Kjør tester IGJEN
6. Verifiser i terminal
```

## 🚨 VANLIGE FEIL Å UNNGÅ

❌ **Gjør IKKE dette:**
- Si "ferdig" uten å kjøre tester
- Endre database uten migrasjon
- Endre API uten å oppdatere dokumentasjon
- Commit med feilende tester
- Anta at noe fungerer - SJEKK det!
- Bruke gamle navn (`competence_groups`, `kompetanse_id`)

✅ **Gjør dette:**
- Kjør tester ALLTID
- Lag migrasjonsfiler for database endringer
- Oppdater dokumentasjon samtidig med kode
- Verifiser i terminal at alt fungerer
- Bruk nye navn (`talents`, `talent_id`)
- Sjekk at build passerer

## 🎮 Git Hooks (Automatisk Sjekk)

Pre-commit hook kjører automatisk:
1. Backend tester
2. Frontend build
3. Dokumentasjons-sjekk

**Hvis pre-commit feiler:**
```bash
# Fiks feilene først, deretter:
git add .
git commit -m "din melding"
```

## 📝 VIKTIGE NAVNEKONVENSJONER

| Kontekst | Format | Eksempel |
|----------|--------|----------|
| Database tabeller | snake_case | `bruker_talent` |
| Database kolonner | snake_case | `talent_id` |
| Backend JS | camelCase | `talentId` |
| Frontend TS | camelCase | `talentId` |
| SQL path separator | ` → ` | `"Lyd → Band"` |

## 🔄 DATABASE ENDRINGER

**ALLTID følg denne prosessen:**
```bash
1. Lag migrasjonsfil: backend/migrations/XXX_beskrivelse.sql
2. Oppdater: backend/schema.sql
3. Oppdater: DATABASE.md
4. Test migrering lokalt: psql -d voluplan -f migrations/XXX.sql
5. Kjør backend tester
6. Oppdater MIGRATION_NOTES.md (hvis breaking change)
```

## 🎯 CURSOR AI: HUSK DETTE

Før du svarer "ferdig" eller "alt fungerer":
1. Har du kjørt `npm test`? 
2. Har du kjørt `npm run build`?
3. Har du sjekket terminal output?
4. Har du oppdatert dokumentasjon?

**Hvis NEI på noen av disse: DU ER IKKE FERDIG!**

---

## 📚 Relaterte Filer

- `.cursorrules` - AI regler
- `ARCHITECTURE.md` - Arkitektur dokumentasjon
- `DATABASE.md` - Database schema
- `MIGRATION_NOTES.md` - Migrasjon historikk
- `.husky/pre-commit` - Git hook som tvinger sjekker

