# Database Dokumentasjon - Voluplan

## Oversikt
Voluplan bruker PostgreSQL som database for å håndtere brukere, talenter (3-nivå hierarki), produksjoner og bemanningsplanlegging.

**Siste oppdatering:** 2025-10-17  
**Versjon:** 019 (Fjernet FK-avhengighet mellom produksjoner og talent-hierarkiet)

## Database Tabeller

### 1. `users` - Brukeradministrasjon
Sentral tabell for alle brukere i systemet.

**Kolonner:**
- `id` (SERIAL PRIMARY KEY) - Unik bruker-ID
- `first_name` (VARCHAR(100) NOT NULL) - Fornavn
- `last_name` (VARCHAR(100) NOT NULL) - Etternavn
- `email` (VARCHAR(255) UNIQUE NOT NULL) - E-postadresse (unik, kan endres med sikkerhet)
- `password_hash` (VARCHAR(255)) - Hashet passord (nullable for OAuth-brukere)
- `phone_number` (VARCHAR(20)) - Mobilnummer
- `roles` (TEXT[] DEFAULT '{}') - Array av brukerroller
- `talents` (TEXT[] DEFAULT '{}') - **Deprecated:** Bruk `bruker_talent` tabell i stedet
- `is_active` (BOOLEAN DEFAULT true) - Om brukeren er aktiv
- `google_id` (VARCHAR(255) UNIQUE) - Google OAuth ID
- `facebook_id` (VARCHAR(255) UNIQUE) - Facebook OAuth ID
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

**E-postendring sikkerhet:**
- Brukere med passord må bekrefte med nåværende passord for å endre sin egen e-post
- Admin kan endre andres e-post uten passord (endringen logges i backend)
- OAuth/kun talent brukere må kontakte admin for e-postendring

**Indekser:**
- Primærnøkkel på `id`
- Unik indeks på `email`
- Unik indeks på `google_id`
- Unik indeks på `facebook_id`

---

### 2. `password_reset_tokens` - Passordtilbakestilling
Håndterer tokens for passordgjenoppretting.

**Kolonner:**
- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER NOT NULL) - Referanse til `users.id`
- `token` (VARCHAR(255) UNIQUE NOT NULL) - Tilbakestillingstoken
- `expires_at` (TIMESTAMP NOT NULL) - Utløpstidspunkt
- `used` (BOOLEAN DEFAULT false) - Om token er brukt
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

**Relasjoner:**
- `user_id` → `users.id` (ON DELETE CASCADE)

**Indekser:**
- Primærnøkkel på `id`
- Unik indeks på `token`
- Indeks på `user_id`

---

### 3. `talentkategori` - Hierarkiske kategorier for talenter (fleksibel dybde)
Organiserer talenter i hierarkisk struktur. Talenter kan legges på ethvert nivå.

**Viktig regel:** En kategori kan enten ha:
- Sub-kategorier (children), ELLER
- Talenter

**IKKE begge deler samtidig!**

**Eksempel 1 (talent på nivå 2):**
```
Musikk (nivå 1)
└─ Klassisk piano (talent direkte under)
```

**Eksempel 2 (3 nivåer):**
```
Foto&Video (nivå 1)
└─ Lyd (nivå 2)
    └─ Band (nivå 3)
        └─ Klassisk gitar (talent)
```

**Kolonner:**
- `id` (SERIAL PRIMARY KEY)
- `navn` (VARCHAR(100) NOT NULL) - Kategori navn
- `parent_id` (INTEGER) - Referanse til overordnet kategori (NULL = root nivå)
- `beskrivelse` (TEXT)
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

**Constraints:**
- UNIQUE (`navn`, `parent_id`) - Samme navn kan brukes på forskjellige nivåer

**Relasjoner:**
- `parent_id` → `talentkategori.id` (ON DELETE CASCADE) - Self-referencing

**Indekser:**
- Primærnøkkel på `id`
- Indeks på `parent_id`
- Indeks på `navn`

---

### 4. `talent` - Spesifikke talenter/kompetanser
Definerer spesifikke talenter som personer kan inneha.

**Kolonner:**
- `id` (SERIAL PRIMARY KEY)
- `navn` (VARCHAR(100) NOT NULL) - Talent navn
- `kategori_id` (INTEGER NOT NULL) - Referanse til `talentkategori.id`
- `leder_id` (INTEGER) - Referanse til ansvarlig leder (`users.id`)
- `beskrivelse` (TEXT) - Beskrivelse av talentet
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

**Relasjoner:**
- `kategori_id` → `talentkategori.id` (ON DELETE RESTRICT)
- `leder_id` → `users.id` (ON DELETE SET NULL)

**Indekser:**
- Primærnøkkel på `id`
- Indeks på `kategori_id`
- Indeks på `leder_id`

---

### 5. `bruker_talent` - Bruker-Talent Relasjon (Mange-til-mange)
Kobler brukere til talenter de innehar. En person må ha et talent her før de kan bemennes med det.

**Kolonner:**
- `id` (SERIAL PRIMARY KEY)
- `bruker_id` (INTEGER NOT NULL) - Referanse til `users.id`
- `talent_id` (INTEGER NOT NULL) - Referanse til `talent.id`
- `erfaringsnivaa` (VARCHAR(50) DEFAULT 'avansert') - grunnleggende, middels, avansert, ekspert (standard: avansert)
- `notater` (TEXT) - Notater om brukerens erfaring
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

**Merk:** Feltet `sertifisert` er fjernet da det ikke ga mening i konteksten.

**Constraints:**
- UNIQUE (`bruker_id`, `talent_id`) - En person kan bare ha samme talent én gang

**Relasjoner:**
- `bruker_id` → `users.id` (ON DELETE CASCADE)
- `talent_id` → `talent.id` (ON DELETE CASCADE)

**Indekser:**
- Primærnøkkel på `id`
- Indeks på `bruker_id`
- Indeks på `talent_id`
- Indeks på `erfaringsnivaa`

**Forretningslogikk:**
- En person må ha talentet i `bruker_talent` før de kan bemennes i `produksjon_bemanning`
- Dette sikrer at kun kvalifiserte personer kan tildeles oppgaver
- Brukere kan være registrert som:
  - **Aktiv bruker** (`is_active = true`): Kan logge inn og bruke applikasjonen
  - **Kun talent** (`is_active = false`): Registrert med talents, men kan ikke logge inn
  
**Eksempel bruk:**
En person som kun skal være med i produksjoner (f.eks. frilansere, vikarer) kan registreres som "kun talent" uten å kunne logge inn i systemet.

---

### 6. `produksjonskategori` - Kategorier for produksjoner
- `beskrivelse` (TEXT) - Beskrivelse av kategorien
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

**Indekser:**
- Primærnøkkel på `id`
- Unik indeks på `navn`

**Eksempler:**
- Lyd
- Lys
- Scene
- Backstage
- Administrasjon

---

### 4. `kompetanse` - Spesifikke kompetanser
Definerer spesifikke kompetanser/roller som personer kan ha.

**Kolonner:**
- `id` (SERIAL PRIMARY KEY)
- `navn` (VARCHAR(100) NOT NULL) - Kompetansenavn
- `kategori_id` (INTEGER NOT NULL) - Referanse til `kompetansekategori.id`
- `leder_id` (INTEGER) - Referanse til ansvarlig leder (`users.id`)
- `beskrivelse` (TEXT) - Beskrivelse av kompetansen
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

**Relasjoner:**
- `kategori_id` → `kompetansekategori.id` (ON DELETE RESTRICT)
- `leder_id` → `users.id` (ON DELETE SET NULL)

**Indekser:**
- Primærnøkkel på `id`
- Indeks på `kategori_id`
- Indeks på `leder_id`

**Eksempler:**
- Lydtekniker (kategori: Lyd)
- Lysoperatør (kategori: Lys)
- Scenemester (kategori: Scene)
- Garderobemester (kategori: Backstage)

---

### 5. `produksjonskategori` - Kategorier for produksjoner
Klassifiserer ulike typer produksjoner/arrangementer.

**Kolonner:**
- `id` (SERIAL PRIMARY KEY)
- `navn` (VARCHAR(100) UNIQUE NOT NULL) - Kategorinavn
- `beskrivelse` (TEXT) - Beskrivelse av kategorien
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

**Indekser:**
- Primærnøkkel på `id`
- Unik indeks på `navn`

**Eksempler:**
- Konsert
- Teaterforestilling
- Festival
- Workshop
- Møte

---

### 5b. `produksjonskategori_talent_mal` - Talent-maler for produksjonskategorier
Definerer en mal/template av talenter med antall for hver produksjonskategori. Brukes til å populere bemanningsliste når man oppretter ny produksjon.

**Kolonner:**
- `id` (SERIAL PRIMARY KEY)
- `kategori_id` (INTEGER NOT NULL) - Referanse til `produksjonskategori.id`
- `talent_id` (INTEGER NOT NULL) - Referanse til `talent.id`
- `antall` (INTEGER NOT NULL DEFAULT 1) - Antall personer med dette talentet (må være > 0)
- `beskrivelse` (TEXT) - Valgfri beskrivelse av rollen i denne kategorien
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

**Constraints:**
- UNIQUE (`kategori_id`, `talent_id`) - En kategori kan kun ha et talent én gang i malen
- CHECK (`antall` > 0) - Antall må være minst 1

**Relasjoner:**
- `kategori_id` → `produksjonskategori.id` (ON DELETE CASCADE)
- `talent_id` → `talent.id` (ON DELETE CASCADE)

**Indekser:**
- Primærnøkkel på `id`
- Indeks på `kategori_id`

---

### 5c. `produksjonskategori_plan_mal_element` - Plan-mal for produksjonskategorier
Definerer en standard agenda/plan for hver produksjonskategori. Støtter hierarkisk struktur med overskrifter (grupperinger) og hendelser (tidsbaserte aktiviteter).

**Kolonner:**
- `id` (SERIAL PRIMARY KEY)
- `kategori_id` (INTEGER NOT NULL) - Referanse til `produksjonskategori.id`
- `type` (VARCHAR(20) NOT NULL) - 'overskrift' eller 'hendelse'
- `navn` (VARCHAR(200) NOT NULL) - Navn på overskrift/hendelse
- `varighet_minutter` (INTEGER) - Varighet i minutter (NULL for overskrifter, påkrevd for hendelser)
- `parent_id` (INTEGER) - Referanse til overordnet overskrift (NULL for overskrifter, påkrevd for hendelser)
- `rekkefølge` (INTEGER NOT NULL DEFAULT 0) - Sorteringsrekkefølge innenfor samme kategori/parent
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

**Constraints:**
- CHECK (`type` IN ('overskrift', 'hendelse'))
- CHECK (`varighet_minutter` IS NULL OR `varighet_minutter` >= 0)
- CHECK Overskrift-struktur: 
  - Overskrifter MÅ ha `parent_id = NULL` og `varighet_minutter = NULL`
  - Hendelser MÅ ha `parent_id` satt (referanse til overskrift) og `varighet_minutter` satt

**Relasjoner:**
- `kategori_id` → `produksjonskategori.id` (ON DELETE CASCADE)
- `parent_id` → `produksjonskategori_plan_mal_element.id` (ON DELETE CASCADE)

**Hierarkisk struktur:**
```
Overskrift: "Før møtet" (type='overskrift', parent_id=NULL)
  ├─ Hendelse: "Musikk i anlegget" (type='hendelse', parent_id=1, varighet=5 min)
  └─ Hendelse: "Count down" (type='hendelse', parent_id=1, varighet=10 min)
  
Overskrift: "Møtet starter" (type='overskrift', parent_id=NULL)
  ├─ Hendelse: "Lovsang" (type='hendelse', parent_id=4, varighet=4 min)
  └─ Hendelse: "Velkommen" (type='hendelse', parent_id=4, varighet=5 min)
```

**Indekser:**
- Primærnøkkel på `id`
- Indeks på `kategori_id`
- Indeks på `parent_id`
- Kombinert indeks på (`kategori_id`, `parent_id`, `rekkefølge`) for effektiv sortering

**Eksempel bruk:**
```sql
-- Eksempel: Hent hele plan-mal for en kategori i hierarkisk rekkefølge
SELECT *
FROM produksjonskategori_plan_mal_element
WHERE kategori_id = 1
ORDER BY COALESCE(parent_id, id), parent_id NULLS FIRST, rekkefølge, id;
```

---

### 5d. `produksjonskategori_oppmote_mal` - Oppmøtetider-mal for produksjonskategorier
Definerer standard oppmøtetider for hver produksjonskategori. Når en ny produksjon opprettes basert på kategorien, kopieres disse med beregnet faktisk tid.

**Kolonner:**
- `id` (SERIAL PRIMARY KEY)
- `kategori_id` (INTEGER NOT NULL) - Referanse til `produksjonskategori.id`
- `navn` (VARCHAR(200) NOT NULL) - Beskrivende navn (f.eks. "Teknisk crew", "Skuespillere")
- `beskrivelse` (TEXT) - Valgfri beskrivelse av hva som skal gjøres ved oppmøte
- `minutter_før_start` (INTEGER NOT NULL DEFAULT 0) - Minutter før produksjonsstart (0 = samme tid som produksjonsstart)
- `rekkefølge` (INTEGER NOT NULL DEFAULT 0) - Sorteringsrekkefølge
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

**Constraints:**
- CHECK (`minutter_før_start` >= 0)

**Relasjoner:**
- `kategori_id` → `produksjonskategori.id` (ON DELETE CASCADE)

**Indekser:**
- Primærnøkkel på `id`
- Indeks på `kategori_id`
- Kombinert indeks på (`kategori_id`, `rekkefølge`)

**Eksempel:**
```
Teknisk crew: 120 minutter før start (2 timer før)
Skuespillere: 60 minutter før start (1 time før)
Vertskap: 30 minutter før start
```

---

### 6. `produksjonsplan` - Overordnede planer
Grupperer flere produksjoner under en felles plan (f.eks. "Vårsesongen 2025").

---

### 7. `produksjon` - Individuelle produksjoner/arrangementer
Sentral tabell for produksjoner. Når en produksjon opprettes med `applyKategoriMal=true`, kopieres plan, talenter og oppmøtetider fra kategorien.

**Eksempel:**
For kategori "Teaterforestilling":
- 2x Lydtekniker (fra Foto&Video → Lyd)
- 1x Piano (fra Musikk → Band)
- 1x Bass (fra Musikk → Band)
- 2x Lysoperatør (fra Foto&Video → Lys)

---

### 6. `produksjonsplan` - Overordnede produksjonsplaner
Grupperer flere produksjoner under en felles plan (f.eks. "Vårsesongen 2025").

**Kolonner:**
- `id` (SERIAL PRIMARY KEY)
- `navn` (VARCHAR(200) NOT NULL) - Plannavn
- `beskrivelse` (TEXT) - Beskrivelse av planen
- `start_dato` (DATE) - Startdato for planen
- `slutt_dato` (DATE) - Sluttdato for planen
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

**Indekser:**
- Primærnøkkel på `id`

**Eksempler:**
- Vårsesongen 2025
- Sommerfestival 2025
- Juleshow 2025

---

### 7. `produksjon` - Individuelle produksjoner/arrangementer
Representerer konkrete arrangementer/forestillinger.

**Kolonner:**
- `id` (SERIAL PRIMARY KEY)
- `navn` (VARCHAR(200) NOT NULL) - Produksjonsnavn
- `tid` (TIMESTAMP NOT NULL) - Dato og klokkeslett for produksjonen
- (FJERNET) `kategori_id` – Produksjon er frikoblet fra kategori etter opprettelse. Ved oppretting kan en kategori velges for å kopiere mal/plassering, men ingen FK lagres. (Migrasjon 011)
- `publisert` (BOOLEAN DEFAULT false) - Om produksjonen er publisert/synlig
- `beskrivelse` (TEXT) - Detaljert beskrivelse
- `plan_id` (INTEGER) - Referanse til `produksjonsplan.id`
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

**Relasjoner:**
- `plan_id` → `produksjonsplan.id` (ON DELETE SET NULL)

**Indekser:**
- Primærnøkkel på `id`
- Indeks på `plan_id`
- Indeks på `tid`

---

### 7b. Sikring av talent-tabeller (Migrasjon 012)
For drift sørger migrasjon 012 for at følgende tabeller og indekser finnes på miljøet:
- `talentkategori`, `talent`, `bruker_talent`
- Indekser på `kategori_id`, `leder_id`, `parent_id`, `navn`, `bruker_id`, `talent_id`, `erfaringsnivaa`

---

### 7c. `produksjon_plan_element` - Plan-elementer for individuelle produksjoner (Migrasjon 015)
Kopieres fra `produksjonskategori_plan_mal_element` når produksjon opprettes med `applyKategoriMal=true`. Støtter hierarkisk struktur med overskrifter og hendelser.

**Kolonner:**
- `id` (SERIAL PRIMARY KEY)
- `produksjon_id` (INTEGER NOT NULL) - Referanse til `produksjon.id`
- `type` (VARCHAR(20) NOT NULL) - 'overskrift' eller 'hendelse'
- `navn` (VARCHAR(200) NOT NULL) - Navn på overskrift/hendelse
- `varighet_minutter` (INTEGER) - Varighet i minutter (NULL for overskrifter, påkrevd for hendelser)
- `parent_id` (INTEGER) - Referanse til overordnet overskrift (NULL for overskrifter, påkrevd for hendelser)
- `rekkefølge` (INTEGER NOT NULL DEFAULT 0) - Sorteringsrekkefølge
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

**Constraints:**
- CHECK (`type` IN ('overskrift', 'hendelse'))
- CHECK (`varighet_minutter` IS NULL OR `varighet_minutter` >= 0)
- CHECK Overskrift-struktur (samme som kategori plan-mal)

**Relasjoner:**
- `produksjon_id` → `produksjon.id` (ON DELETE CASCADE)
- `parent_id` → `produksjon_plan_element.id` (ON DELETE CASCADE)

**Indekser:**
- Primærnøkkel på `id`
- Indeks på `produksjon_id`
- Indeks på `parent_id`
- Kombinert indeks på (`produksjon_id`, `parent_id`, `rekkefølge`)

**Hvordan data kopieres:**
Når en produksjon opprettes basert på en kategori, kopieres plan-mal element for element. Hierarkisk struktur bevares ved å mappe gamle parent_id'er til nye.

---

### 7d. `produksjon_oppmote` - Oppmøtetider for individuelle produksjoner (Migrasjon 015)
Kopieres fra `produksjonskategori_oppmote_mal` når produksjon opprettes med `applyKategoriMal=true`. Tidspunkt beregnes basert på produksjonens starttid.

**Kolonner:**
- `id` (SERIAL PRIMARY KEY)
- `produksjon_id` (INTEGER NOT NULL) - Referanse til `produksjon.id`
- `navn` (VARCHAR(200) NOT NULL) - Beskrivende navn (f.eks. "Teknisk crew")
- `beskrivelse` (TEXT) - Valgfri beskrivelse
- `tidspunkt` (TIMESTAMP NOT NULL) - Faktisk oppmøtetid (beregnet fra produksjon.tid minus minutter_før_start)
- `rekkefølge` (INTEGER NOT NULL DEFAULT 0) - Sorteringsrekkefølge
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

**Relasjoner:**
- `produksjon_id` → `produksjon.id` (ON DELETE CASCADE)

**Indekser:**
- Primærnøkkel på `id`
- Indeks på `produksjon_id`
- Indeks på `tidspunkt`
- Kombinert indeks på (`produksjon_id`, `rekkefølge`)

**Hvordan data kopieres:**
```typescript
// Eksempel: Produksjon starter kl 19:00
// Oppmøte-mal sier "Teknisk crew: 120 minutter før start"
// Resulterende tidspunkt: 17:00 (19:00 - 2 timer)
const oppmoteTidspunkt = new Date(produksjonTid.getTime() - (minutter_før_start * 60 * 1000));
```

---

### 7e. `produksjon_talent_behov` - Talent-behov for individuelle produksjoner (Migrasjon 016, oppdatert 019)
Kopieres fra `produksjonskategori_talent_mal` når produksjon opprettes med `applyKategoriMal=true`. Definerer hvor mange av hvert talent som trengs for denne spesifikke produksjonen.

**VIKTIG:** Talent-data kopieres som tekst (talent_navn, talent_kategori_sti) og har INGEN FK til talent-hierarkiet. Dette gjør produksjoner uavhengige av endringer i talent-hierarkiet.

**Kolonner:**
- `id` (SERIAL PRIMARY KEY)
- `produksjon_id` (INTEGER NOT NULL) - Referanse til `produksjon.id`
- `talent_navn` (VARCHAR(100) NOT NULL) - Navn på talentet (kopieres fra talent-hierarkiet)
- `talent_kategori_sti` (TEXT NOT NULL) - Full kategori-sti, f.eks. "Lyd → Liveproduksjon → FOH"
- `antall` (INTEGER NOT NULL DEFAULT 1) - Hvor mange personer med dette talentet som trengs
- `beskrivelse` (TEXT) - Valgfri beskrivelse av rollen/behovet
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

**Constraints:**
- `UNIQUE (produksjon_id, talent_navn)` - Ett talent-behov per talent-navn per produksjon
- `CHECK (antall > 0)` - Antall må være positivt

**Relasjoner:**
- `produksjon_id` → `produksjon.id` (ON DELETE CASCADE)
- **INGEN FK til talent-hierarkiet** (data kopieres ved opprettelse)

**Indekser:**
- Primærnøkkel på `id`
- Indeks på `produksjon_id`

**Bruk i API:**
```javascript
// Hentes sammen med bemanning for å vise status
GET /api/produksjon/:id/bemanning
Response: {
  bemanning: [...],        // Faktisk tildelte personer
  talentBehov: [           // Behov definert i kategori-mal
    { 
      talent_id: 1, 
      talent_navn: "FOH Lyd",
      antall: 2,
      // Frontend viser: "FOH Lyd: 1/2" (1 tildelt av 2 nødvendige)
    }
  ]
}
```

**Forskjell fra `produksjon_bemanning`:**
- `produksjon_talent_behov`: Hvor mange trengs (fra kategori-mal)
- `produksjon_bemanning`: Hvem er faktisk tildelt

---

### 8. `produksjon_bemanning` - Kobling mellom produksjoner og personer (Oppdatert v019)
Junction-tabell som håndterer mange-til-mange-forholdet mellom produksjoner, personer og talents.

**VIKTIG:** Talent-data kopieres som tekst (talent_navn, talent_kategori_sti) og har INGEN FK til talent-hierarkiet. Dette gjør produksjoner uavhengige av endringer i talent-hierarkiet.

**Kolonner:**
- `id` (SERIAL PRIMARY KEY)
- `produksjon_id` (INTEGER NOT NULL) - Referanse til `produksjon.id`
- `person_id` (INTEGER NOT NULL) - Referanse til `users.id`
- `talent_navn` (VARCHAR(100) NOT NULL) - Navn på talentet (kopieres fra produksjon_talent_behov)
- `talent_kategori_sti` (TEXT NOT NULL) - Full kategori-sti for talentet
- `notater` (TEXT) - Notater for denne bemanningen
- `status` (VARCHAR(50) DEFAULT 'planlagt') - Status (f.eks. "planlagt", "bekreftet", "avlyst")
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

**Relasjoner:**
- `produksjon_id` → `produksjon.id` (ON DELETE CASCADE)
- `person_id` → `users.id` (ON DELETE CASCADE)
- **INGEN FK til talent-hierarkiet** (data kopieres ved tildeling)

**Constraints:**
- UNIQUE (`produksjon_id`, `person_id`, `talent_navn`)

**Indekser:**
- Primærnøkkel på `id`
- Unik indeks på kombinasjonen (`produksjon_id`, `person_id`, `talent_navn`)
- Indeks på `produksjon_id`
- Indeks på `person_id`

---

## Database Relasjoner

### Entity Relationship Diagram (Tekstformat)

```
┌─────────────────┐
│     users       │
└────────┬────────┘
         │
         │ 1:N (leder)
         ├──────────────────┐
         │                  │
         │                  ▼
         │         ┌─────────────────┐
         │         │   kompetanse    │
         │         └────────┬────────┘
         │                  │
         │                  │ N:1
         │                  ▼
         │         ┌──────────────────────┐
         │         │ kompetansekategori   │
         │         └──────────────────────┘
         │
         │ N:M (via produksjon_bemanning)
         │
         ├─────────────────────────────────┐
         │                                 │
         ▼                                 ▼
┌──────────────────────┐         ┌──────────────────┐
│ produksjon_bemanning │◄────────│   produksjon     │
└──────────────────────┘         └────────┬─────────┘
         ▲                                 │
         │                                 │ N:1
         │                                 ├──────────────────┐
         │                                 │                  │
         │                                 ▼                  ▼
         │                        ┌──────────────────┐  ┌───────────────────┐
         │                        │produksjonskategori│  │ produksjonsplan   │
         │                        └──────────────────┘  └───────────────────┘
         │
         │ N:1
         │
         └────────────────────────────────┐
                                          │
                                          ▼
                                 ┌─────────────────┐
                                 │   kompetanse    │
                                 └─────────────────┘
```

### Relasjonsbeskrivelser

#### 1. Bruker → Kompetanse (Leder)
- **Type:** One-to-Many (1:N)
- **Beskrivelse:** En bruker kan være leder for flere kompetanser
- **Relasjon:** `kompetanse.leder_id` → `users.id`
- **On Delete:** SET NULL (hvis leder slettes, nullstilles leder_id)

#### 2. Kompetansekategori → Kompetanse
- **Type:** One-to-Many (1:N)
- **Beskrivelse:** En kategori kan ha mange kompetanser
- **Relasjon:** `kompetanse.kategori_id` → `kompetansekategori.id`
- **On Delete:** RESTRICT (kan ikke slette kategori med tilknyttede kompetanser)

#### 3. Produksjonskategori → Produksjon
- **Type:** One-to-Many (1:N)
- **Beskrivelse:** En kategori kan ha mange produksjoner
- **Relasjon:** `produksjon.kategori_id` → `produksjonskategori.id`
- **On Delete:** RESTRICT (kan ikke slette kategori med tilknyttede produksjoner)

#### 4. Produksjonsplan → Produksjon
- **Type:** One-to-Many (1:N)
- **Beskrivelse:** En plan kan inneholde mange produksjoner
- **Relasjon:** `produksjon.plan_id` → `produksjonsplan.id`
- **On Delete:** SET NULL (hvis plan slettes, nullstilles plan_id)

#### 5. Produksjon ↔ Bruker (via produksjon_bemanning)
- **Type:** Many-to-Many (N:M)
- **Beskrivelse:** En produksjon kan ha mange personer, og en person kan være med i mange produksjoner
- **Junction-tabell:** `produksjon_bemanning`
- **Relasjoner:**
  - `produksjon_bemanning.produksjon_id` → `produksjon.id` (ON DELETE CASCADE)
  - `produksjon_bemanning.person_id` → `users.id` (ON DELETE CASCADE)

#### 6. Produksjon → Talent (INGEN direkte relasjon) ← **Oppdatert v019**
- **Type:** Ingen direkte FK-relasjon
- **Beskrivelse:** Produksjoner og bemanning kopierer talent-navn og kategori-sti som tekst
- **Relasjon:** INGEN - data kopieres ved opprettelse/tildeling
- **Fordel:** Produksjoner er uavhengige av endringer i talent-hierarkiet. Talents kan slettes fra hierarkiet uten å påvirke eksisterende produksjoner.

#### 7. Bruker → Password Reset Tokens
- **Type:** One-to-Many (1:N)
- **Beskrivelse:** En bruker kan ha flere reset tokens (historisk)
- **Relasjon:** `password_reset_tokens.user_id` → `users.id`
- **On Delete:** CASCADE (når bruker slettes, slettes også tokens)

---

## Nøkkelkonsepter

### Many-to-Many med Metadata
Relasjonen mellom produksjoner og personer er implementert som en rik many-to-many-relasjon:
- **En person** kan ha **flere roller** i **samme produksjon** (ulike talents)
- **En person** kan være med i **flere produksjoner**
- **En produksjon** har **mange personer** med **ulike talents**

Junction-tabellen `produksjon_bemanning` inneholder ikke bare koblingen, men også:
- Hvilken **talent** personen bruker i produksjonen
- **Notater** for denne spesifikke bemanningen
- **Status** (planlagt, bekreftet, avlyst, etc.)

### Eksempel
```
Produksjon: "Sommershow 2025"
├── Ole Nordmann
│   ├── Kompetanse: Lydtekniker (status: bekreftet)
│   └── Kompetanse: Scenemester (status: planlagt)
├── Kari Hansen
│   └── Kompetanse: Lysoperatør (status: bekreftet)
└── Per Olsen
    └── Kompetanse: Lydtekniker (status: avlyst)
```

---

## Nyttige SQL-spørringer

### Liste alle personer og deres kompetanser i en produksjon
```sql
SELECT 
  u.first_name || ' ' || u.last_name AS person,
  k.navn AS kompetanse,
  kk.navn AS kategori,
  pb.status,
  pb.notater
FROM produksjon_bemanning pb
JOIN produksjon p ON pb.produksjon_id = p.id
JOIN users u ON pb.person_id = u.id
JOIN kompetanse k ON pb.kompetanse_id = k.id
JOIN kompetansekategori kk ON k.kategori_id = kk.id
WHERE p.id = 1
ORDER BY u.last_name, u.first_name, k.navn;
```

### Liste alle produksjoner en person er satt opp på
```sql
SELECT 
  p.navn AS produksjon,
  p.tid,
  pk.navn AS kategori,
  k.navn AS kompetanse,
  pb.status
FROM produksjon_bemanning pb
JOIN produksjon p ON pb.produksjon_id = p.id
JOIN produksjonskategori pk ON p.kategori_id = pk.id
JOIN kompetanse k ON pb.kompetanse_id = k.id
WHERE pb.person_id = 1
ORDER BY p.tid DESC;
```

### Finn ledige personer for en spesifikk kompetanse på en dato
```sql
-- Finn alle med en kompetanse som IKKE er opptatt på en gitt dato
SELECT DISTINCT
  u.id,
  u.first_name,
  u.last_name,
  u.email
FROM users u
WHERE u.is_active = true
  -- Personen finnes ikke i bemanning for noen produksjon på samme dato
  AND u.id NOT IN (
    SELECT DISTINCT pb.person_id
    FROM produksjon_bemanning pb
    JOIN produksjon p ON pb.produksjon_id = p.id
    WHERE DATE(p.tid) = DATE('2025-06-15')
  )
ORDER BY u.last_name, u.first_name;
```

### Bemanningsoversikt per produksjon med antall personer
```sql
SELECT 
  p.navn AS produksjon,
  p.tid,
  COUNT(DISTINCT pb.person_id) AS antall_personer,
  COUNT(pb.id) AS antall_oppgaver,
  STRING_AGG(DISTINCT k.navn, ', ') AS kompetanser
FROM produksjon p
LEFT JOIN produksjon_bemanning pb ON p.id = pb.produksjon_id
LEFT JOIN kompetanse k ON pb.kompetanse_id = k.id
WHERE p.tid > CURRENT_TIMESTAMP
GROUP BY p.id, p.navn, p.tid
ORDER BY p.tid;
```

---

## Migrasjoner

Database-skjemaet er definert i følgende filer:
- `backend/schema.sql` - Hovedskjema for alle tabeller
- `backend/migrations/001_add_kompetanse_tables.sql` - Kompetansetabeller
- `backend/migrations/002_add_produksjon_tables.sql` - Produksjonstabeller
- `backend/migrations/019_decouple_produksjon_from_talent_hierarchy.sql` - **VIKTIG:** Fjernet FK fra produksjoner til talent-hierarkiet, kopier talent-data som tekst i stedet

For å sette opp databasen fra scratch:
```bash
# Opprett database
createdb voluplan

# Kjør hovedskjema
psql voluplan < backend/schema.sql

# Sett inn testdata (valgfritt)
psql voluplan << 'EOF'
-- Se backend/example_queries.sql for eksempler
EOF
```

---

## Testdata

Eksempel på test-bruker:
- **Email:** test@example.com
- **Passord:** passord123
- **Navn:** Test Bruker

---

## Notater

### Cascade-regler
- Når en **produksjon slettes**: Alle bemanninger, plan-elementer, oppmøter og talent-behov for den produksjonen slettes automatisk (CASCADE)
- Når en **bruker slettes**: Alle bemanninger og password reset tokens slettes automatisk (CASCADE)
- Når en **talentkategori** skal slettes: Må ikke ha tilknyttede talents (RESTRICT)
- Når en **talent** slettes fra hierarkiet: Talent-maler i produksjonskategorier slettes (CASCADE), men **produksjoner påvirkes IKKE** fordi de har kopier av talent-data som tekst ← **Oppdatert i v019**

### Soft Delete
Systemet bruker `is_active` på brukere for soft delete i stedet for å slette brukere direkte. Dette bevarer historisk data i bemanningsoppføringer.

### Timestamps
Alle tabeller har `created_at` og `updated_at` for å spore når data ble opprettet og sist endret.


