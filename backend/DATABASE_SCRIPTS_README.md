# Database Scripts

## Oversikt

Dette mappen inneholder scripts for å administrere databasen:

- **`reset_database.sql`** - Sletter all data fra databasen
- **`seed_data.sql`** - Laster inn dagens data (brukere, talents - UTEN produksjoner)
- **`reset_and_seed.sh`** - Kjører begge scriptene i én operasjon

## Bruk

### Alternativ 1: Kjør begge i én operasjon (anbefalt)

```bash
cd backend
./reset_and_seed.sh
```

Dette vil:
1. Slette all data fra databasen
2. Resette alle sequences (ID-er starter på riktige verdier)
3. Laste inn dagens data med:
   - 5 brukere (test@example.com + 4 andre)
   - Talent-hierarki (dagens struktur med 11 kategorier, 32 talents)
   - Bruker-talents (8 koblinger)
   - INGEN produksjoner
   - INGEN produksjonskategorier

### Alternativ 2: Kjør manuelt

```bash
cd backend
source .env
psql "postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME" -f reset_database.sql
psql "postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME" -f seed_data.sql
```

## Testdata som lastes inn

### Brukere
- **test@example.com** (passord: passord123) - Admin-bruker for testing ✅
- **ole.nordmann@example.com** (passord: passord123) - Lydtekniker
- **kari.hansen@example.com** (passord: passord123) - Foto/Video
- **per.jensen@example.com** (passord: passord123) - Musiker (pianist)
- **lise.berg@example.com** (passord: passord123) - Scene/Produksjon

### Talent-hierarki (dagens struktur)
- **Teknisk produksjon**
  - FOH → Lydtekniker, Lys, Projektor, Teknisk leder
  - Foto&Video → Regi, Kameraoperatør, Fotograf
  - Rigg → Tilhengersjåfør, Teknisk rigg, Rigg, Dekoratør
- **Kreativ/Innhold**
  - Musikk → Piano, Trommer, Bass, Kassegitar, El-gitar, Strykere
  - Lovsang → Lovsangsleder, Lovsangsteam, Vokalist
  - Dans
  - Innhold → Undervisning, GTleder, Konferansier
- **Vertskap** → Hovedmøtevert, Møtevert, Tolk - engelsk, Infostand, Velkomstteam, Forbønn
- **Salg** → Kiosk, Kafémedarbeider, Kjøkkenteam

### Bruker-talents (hvem kan hva)
- **Test Bruker (test@example.com):** Regi, Kameraoperatør, Undervisning
- **Kari Hansen:** Lovsangsleder
- **Per Jensen:** GTleder, Konferansier
- **Lise Berg:** Piano, Kassegitar

### Produksjoner og kategorier
- **INGEN** - Databasen inneholder kun brukere og talents, ingen produksjoner

## Viktig å merke seg

### Passord
✅ **Alle testbrukere har passord: `passord123`**

Passordene er hashet med bcrypt og kan brukes direkte for innlogging.

For å generere nye hashes (hvis du vil endre passord):
```bash
cd backend
node generate_password_hash.js
```

### Produksjoner er uavhengige av talent-hierarkiet
Når en produksjon opprettes fra en kategori-mal, kopieres talent-data som tekst:
- `talent_navn` (VARCHAR)
- `talent_kategori_sti` (TEXT)

Dette betyr:
- ✅ Du kan slette talents fra hierarkiet uten å påvirke eksisterende produksjoner
- ✅ Produksjoner bevarer talent-informasjon selv om talent-hierarkiet endres
- ⚠️ Endringer i talent-hierarkiet påvirker IKKE eksisterende produksjoner

## Advarsel

⚠️ **DISSE SCRIPTENE SLETTER ALL DATA I DATABASEN!**

Bruk kun for:
- Lokal utvikling
- Testing
- Staging-miljøer

**ALDRI** kjør disse i produksjon!

