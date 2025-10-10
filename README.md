# Voluplan - Volunteer Planning System

Et moderne fullstack system for planlegging av frivillige til show og arrangementer, med fokus på kompetansebasert ressursallokering.

## Funksjoner

### Autentisering
- ✅ Login med e-post og passord
- ✅ Login med Google OAuth
- ✅ Login med Facebook OAuth
- ✅ Passord reset via e-post
- ✅ JWT-basert autentisering

### Brukeradministrasjon
- ✅ Brukerdatabase med fornavn, etternavn, e-post
- ✅ Roller i systemet
- ✅ Kompetansegrupper
- ✅ Kun registrerte brukere kan logge inn

### Grensesnitt
- ✅ Moderne, responsivt design med Material UI
- ✅ Gradient-basert fargepalett
- ✅ Intuitivt brukergrensesnitt

## Teknologier

### Backend
- Node.js
- Express
- PostgreSQL
- JWT (jsonwebtoken)
- Passport.js (Google & Facebook OAuth)
- Nodemailer (e-post)
- bcryptjs (passord hashing)

### Frontend
- React 18
- TypeScript
- Material UI (MUI)
- React Router
- Axios

## 🚀 Quick Start

```bash
# 1. Klon repo
git clone https://github.com/thomahawk72/voluplan.git
cd voluplan

# 2. Installer dependencies
npm run install:all

# 3. Sett opp database
createdb voluplan
psql voluplan < backend/schema.sql

# 4. Konfigurer environment
cd backend && cp .env.example .env
cd ../frontend && cp .env.example .env
cd ..
# Rediger backend/.env med dine verdier

# 5. Start applikasjonen
npm run dev
```

Åpne http://localhost:3000 i nettleseren! 🎉

---

## Kom i gang

### Forutsetninger
- Node.js 18+ og npm
- PostgreSQL 12+
- Google OAuth credentials (valgfritt)
- Facebook OAuth credentials (valgfritt)
- SMTP server for e-post (f.eks. Gmail)

### Installasjon

#### 1. Klon repositoryet
```bash
git clone https://github.com/thomahawk72/voluplan.git
cd voluplan
```

#### 2. Sett opp databasen
```bash
# Opprett database
createdb voluplan

# Kjør schema
psql voluplan < backend/schema.sql
```

#### 3. Installer alle dependencies
```bash
# Fra root-mappen
npm run install:all
```

Dette installerer dependencies for root, backend og frontend.

#### 4. Konfigurer backend
```bash
cd backend

# Kopier .env.example til .env og fyll inn verdier
cp .env.example .env
nano .env
```

Rediger `.env` og fyll inn:
- Database credentials
- JWT secret
- Google OAuth credentials (valgfritt)
- Facebook OAuth credentials (valgfritt)
- SMTP e-post innstillinger

#### 4b. Konfigurer frontend
```bash
cd frontend

# Kopier .env.example til .env
cp .env.example .env
```

Standard verdier i frontend `.env` burde fungere for lokal utvikling.

**Merk:** For lokal utvikling kjører backend på port 5001 og frontend på port 3000. 
I produksjon (Heroku) serverer backend både API og frontend på samme port.

#### 5. Start utviklingsservere

**Metode 1: Start alt med én kommando (anbefalt)**
```bash
npm run dev
```

Dette starter både backend og frontend samtidig!

**Metode 2: Start hver del separat**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm start
```

Applikasjonen kjører nå på:
- Frontend: http://localhost:3000
- Backend: http://localhost:5001
- Backend health check: http://localhost:5001/health

### Nyttige Kommandoer

```bash
# Installer alle dependencies (root, backend og frontend)
npm run install:all

# Start både backend og frontend
npm run dev

# Kjør tester
npm test

# Kjør tester i watch mode
npm run test:watch

# Bygg frontend for produksjon
npm run build

# Start backend i produksjonsmodus
npm start
```

## Bruk

### Første gangs oppsett

1. Opprett en admin-bruker direkte i databasen:
```sql
INSERT INTO users (first_name, last_name, email, password_hash, roles, is_active)
VALUES (
  'Admin',
  'User',
  'admin@example.com',
  '$2a$10$...',  -- Bruk bcrypt til å hashe passord
  ARRAY['admin'],
  true
);
```

2. Logg inn med admin-brukeren
3. Opprett nye brukere via admin-grensesnittet (kommer snart)

### OAuth Setup

#### Google OAuth
1. Gå til [Google Cloud Console](https://console.cloud.google.com/)
2. Opprett et nytt prosjekt
3. Aktiver Google+ API
4. Opprett OAuth 2.0 credentials
5. Legg til authorized redirect URI: `http://localhost:5001/api/auth/google/callback`
6. Kopier Client ID og Client Secret til `.env`

#### Facebook OAuth
1. Gå til [Facebook Developers](https://developers.facebook.com/)
2. Opprett en ny app
3. Legg til Facebook Login product
4. Legg til Valid OAuth Redirect URI: `http://localhost:5001/api/auth/facebook/callback`
5. Kopier App ID og App Secret til `.env`

## Deployment til Heroku

Dette prosjektet er konfigurert for enkel deployment til Heroku. Se [HEROKU_DEPLOYMENT.md](HEROKU_DEPLOYMENT.md) for detaljert guide.

### Quick Deploy
```bash
# Opprett Heroku app
heroku create your-app-name

# Legg til PostgreSQL
heroku addons:create heroku-postgresql:mini

# Sett environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_secure_secret
# ... (se HEROKU_DEPLOYMENT.md for alle variabler)

# Deploy
git push heroku main

# Initialiser database
heroku pg:psql < backend/schema.sql
```

På Heroku:
- Backend serverer både API og frontend
- Automatisk bygger frontend via `heroku-postbuild`
- Kjører på én dynamisk port
- Frontend bruker relative URL for API-kall

## Database Schema

### Tabeller

**users** - Brukere i systemet
- Autentisering (e-post/passord, Google OAuth, Facebook OAuth)
- Roller og kompetansegrupper
- Personlig informasjon

**kompetansekategori** - Kategorier for kompetanser
- Navn (unik)
- Beskrivelse
- Eksempler: Lyd, Lys, Scene, Video

**kompetanse** - Spesifikke kompetanser
- Navn
- Kategori (foreign key til kompetansekategori)
- Leder (foreign key til users)
- Beskrivelse
- Eksempler: FOH Lyd, Lysbord operatør

**password_reset_tokens** - Tokens for passord reset
- Lenket til bruker
- Utløpstid
- Engangsbruk

**produksjonskategori** - Kategorier for produksjoner
- Navn (unik)
- Beskrivelse
- Eksempler: Konsert, Teater, Festival, Konferanse

**produksjonsplan** - Overordnede planer/sesonger
- Navn
- Start- og sluttdato
- Beskrivelse
- Eksempel: "Høst 2025"

**produksjon** - Konkrete produksjoner/show
- Navn
- Tidspunkt
- Kategori (foreign key til produksjonskategori)
- Publisert status (boolean)
- Beskrivelse (lang tekst)
- Plan (foreign key til produksjonsplan)

**produksjon_bemanning** - Mange-til-mange kobling
- Kobler produksjon, person og kompetanse
- En person kan ha flere kompetanser i samme produksjon
- En person kan være med i flere produksjoner
- Status (planlagt, bekreftet, etc.)
- Notater
- UNIQUE constraint: (produksjon_id, person_id, kompetanse_id)

### Database Relasjoner

```
users (personer)
  ↓ 1:N
kompetanse.leder_id (leder for kompetanse)

kompetansekategori
  ↓ 1:N
kompetanse.kategori_id

produksjonskategori
  ↓ 1:N
produksjon.kategori_id

produksjonsplan
  ↓ 1:N
produksjon.plan_id

Mange-til-mange (via produksjon_bemanning):
produksjon ←→ users (personer)
produksjon ←→ kompetanse
users ←→ kompetanse (innenfor en produksjon)
```

### Eksempel Queries

Se `backend/example_queries.sql` for nyttige SQL-queries, inkludert:
- Liste alle personer og kompetanser for en produksjon
- Liste alle produksjoner en person er satt opp på
- Statistikk over mest brukte kompetanser
- Kommende produksjoner
- Ledige/manglende kompetanser for en produksjon

## Prosjektstruktur

```
voluplan/
├── backend/
│   ├── config/
│   │   ├── database.js
│   │   └── passport.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── rateLimiter.js
│   ├── migrations/
│   │   ├── 001_add_kompetanse_tables.sql
│   │   └── 002_add_produksjon_tables.sql
│   ├── example_queries.sql
│   ├── routes/
│   │   ├── auth.js
│   │   └── users.js
│   ├── services/
│   │   └── emailService.js
│   ├── utils/
│   │   ├── envValidator.js
│   │   ├── errorHandler.js
│   │   ├── oauthHelpers.js
│   │   └── userMapper.js
│   ├── schema.sql
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── ProtectedRoute.tsx
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── ForgotPassword.tsx
│   │   │   ├── ResetPassword.tsx
│   │   │   ├── AuthCallback.tsx
│   │   │   └── Dashboard.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   └── App.tsx
│   └── package.json
└── README.md
```

## API Endpoints

### Autentisering
- `POST /api/auth/login` - Login med e-post og passord
- `POST /api/auth/forgot-password` - Be om passord reset
- `POST /api/auth/reset-password` - Tilbakestill passord med token
- `GET /api/auth/google` - Start Google OAuth flow
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/facebook` - Start Facebook OAuth flow
- `GET /api/auth/facebook/callback` - Facebook OAuth callback
- `GET /api/auth/me` - Hent innlogget bruker
- `POST /api/auth/logout` - Logg ut

### Brukere
- `GET /api/users` - Hent alle brukere (admin)
- `GET /api/users/:id` - Hent bruker
- `POST /api/users` - Opprett bruker (admin)
- `PUT /api/users/:id` - Oppdater bruker
- `DELETE /api/users/:id` - Slett bruker (admin)

## Sikkerhet

- Passord hashet med bcrypt
- JWT tokens for autentisering
- HTTP-only cookies for token storage
- CORS konfigurert
- Input validering med express-validator
- SQL injection beskyttelse med parameteriserte queries

## Lisens

ISC

## Forfatter

Voluplan Team

