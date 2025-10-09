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

#### 3. Konfigurer backend
```bash
cd backend

# Installer dependencies
npm install

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

#### 4. Konfigurer frontend
```bash
cd ../frontend

# Installer dependencies
npm install

# Kopier .env.example til .env
cp .env.example .env
```

#### 5. Start utviklingsservere

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
- Backend: http://localhost:5000

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
5. Legg til authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Kopier Client ID og Client Secret til `.env`

#### Facebook OAuth
1. Gå til [Facebook Developers](https://developers.facebook.com/)
2. Opprett en ny app
3. Legg til Facebook Login product
4. Legg til Valid OAuth Redirect URI: `http://localhost:5000/api/auth/facebook/callback`
5. Kopier App ID og App Secret til `.env`

## Prosjektstruktur

```
voluplan/
├── backend/
│   ├── config/
│   │   ├── database.js
│   │   └── passport.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── users.js
│   ├── services/
│   │   └── emailService.js
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

