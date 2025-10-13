# Database Dokumentasjon - Voluplan

## Oversikt
Voluplan bruker PostgreSQL som database for å håndtere brukere, talenter (3-nivå hierarki), produksjoner og bemanningsplanlegging.

**Siste oppdatering:** 2025-10-11  
**Versjon:** 007 (3-nivå talent hierarki + bruker-talent relasjon)

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
- Indeks på `talent_id`

**Bruk:**
Når en ny produksjon opprettes med `applyTalentMal=true`, kan systemet hente talent-malen for den valgte produksjonskategorien og foreslå denne som utgangspunkt for bemanning.

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
- `kategori_id` (INTEGER) - Referanse til `produksjonskategori.id`
- `publisert` (BOOLEAN DEFAULT false) - Om produksjonen er publisert/synlig
- `beskrivelse` (TEXT) - Detaljert beskrivelse
- `plan_id` (INTEGER) - Referanse til `produksjonsplan.id`
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

**Relasjoner:**
- `kategori_id` → `produksjonskategori.id` (ON DELETE RESTRICT)
- `plan_id` → `produksjonsplan.id` (ON DELETE SET NULL)

**Indekser:**
- Primærnøkkel på `id`
- Indeks på `kategori_id`
- Indeks på `plan_id`
- Indeks på `tid`

---

### 8. `produksjon_bemanning` - Kobling mellom produksjoner og personer
Junction-tabell som håndterer mange-til-mange-forholdet mellom produksjoner, personer og kompetanser.

**Kolonner:**
- `id` (SERIAL PRIMARY KEY)
- `produksjon_id` (INTEGER NOT NULL) - Referanse til `produksjon.id`
- `person_id` (INTEGER NOT NULL) - Referanse til `users.id`
- `kompetanse_id` (INTEGER NOT NULL) - Referanse til `kompetanse.id`
- `notater` (TEXT) - Notater for denne bemanningen
- `status` (VARCHAR(50) DEFAULT 'planlagt') - Status (f.eks. "planlagt", "bekreftet", "avlyst")
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

**Relasjoner:**
- `produksjon_id` → `produksjon.id` (ON DELETE CASCADE)
- `person_id` → `users.id` (ON DELETE CASCADE)
- `kompetanse_id` → `kompetanse.id` (ON DELETE RESTRICT)

**Constraints:**
- UNIQUE (`produksjon_id`, `person_id`, `kompetanse_id`)

**Indekser:**
- Primærnøkkel på `id`
- Unik indeks på kombinasjonen (`produksjon_id`, `person_id`, `kompetanse_id`)
- Indeks på `produksjon_id`
- Indeks på `person_id`
- Indeks på `kompetanse_id`

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

#### 6. Produksjon_bemanning → Kompetanse
- **Type:** Many-to-One (N:1)
- **Beskrivelse:** Hver bemanningspost er knyttet til én kompetanse
- **Relasjon:** `produksjon_bemanning.kompetanse_id` → `kompetanse.id`
- **On Delete:** RESTRICT (kan ikke slette kompetanse som brukes i bemanning)

#### 7. Bruker → Password Reset Tokens
- **Type:** One-to-Many (1:N)
- **Beskrivelse:** En bruker kan ha flere reset tokens (historisk)
- **Relasjon:** `password_reset_tokens.user_id` → `users.id`
- **On Delete:** CASCADE (når bruker slettes, slettes også tokens)

---

## Nøkkelkonsepter

### Many-to-Many med Metadata
Relasjonen mellom produksjoner og personer er implementert som en rik many-to-many-relasjon:
- **En person** kan ha **flere roller** i **samme produksjon** (ulike kompetanser)
- **En person** kan være med i **flere produksjoner**
- **En produksjon** har **mange personer** med **ulike kompetanser**

Junction-tabellen `produksjon_bemanning` inneholder ikke bare koblingen, men også:
- Hvilken **kompetanse** personen bruker i produksjonen
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
- Når en **produksjon slettes**: Alle bemanninger for den produksjonen slettes automatisk (CASCADE)
- Når en **bruker slettes**: Alle bemanninger og password reset tokens slettes automatisk (CASCADE)
- Når en **kompetansekategori** skal slettes: Må ikke ha tilknyttede kompetanser (RESTRICT)
- Når en **kompetanse** skal slettes: Må ikke brukes i noen bemanning (RESTRICT)

### Soft Delete
Systemet bruker `is_active` på brukere for soft delete i stedet for å slette brukere direkte. Dette bevarer historisk data i bemanningsoppføringer.

### Timestamps
Alle tabeller har `created_at` og `updated_at` for å spore når data ble opprettet og sist endret.


