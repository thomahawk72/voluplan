# Heroku Deployment Guide

## Lokal Utvikling vs Produksjon

### Lokal Utvikling
- **Backend**: Kjører på port 5001
- **Frontend**: Kjører på port 3000
- Bruker separate servere for backend og frontend
- Frontend kobler til backend via `http://localhost:5001/api`

### Produksjon (Heroku)
- Backend serverer både API og frontend static files
- Kjører på én dynamisk port (satt av Heroku)
- Frontend bruker relative URL (`/api`) for API-kall
- Automatisk bygger frontend via `heroku-postbuild` script

## Deploye til Heroku

### 1. Opprett Heroku App
```bash
heroku create your-app-name
```

### 2. Sett Environment Variables
```bash
# Database (Heroku PostgreSQL addon setter DATABASE_URL automatisk)
heroku addons:create heroku-postgresql:mini

# Applikasjonskonfigurasjon
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_secure_jwt_secret
heroku config:set JWT_EXPIRES_IN=7d

# Frontend URL (din Heroku app URL)
heroku config:set FRONTEND_URL=https://your-app-name.herokuapp.com

# Email konfigurasjon
heroku config:set EMAIL_HOST=smtp.gmail.com
heroku config:set EMAIL_PORT=587
heroku config:set EMAIL_SECURE=false
heroku config:set EMAIL_USER=your_email@gmail.com
heroku config:set EMAIL_PASSWORD=your_app_password
heroku config:set EMAIL_FROM="Voluplan <noreply@voluplan.com>"

# OAuth (valgfritt)
heroku config:set GOOGLE_CLIENT_ID=your_google_client_id
heroku config:set GOOGLE_CLIENT_SECRET=your_google_client_secret
heroku config:set GOOGLE_CALLBACK_URL=https://your-app-name.herokuapp.com/api/auth/google/callback
```

### 3. Deploy
```bash
git add .
git commit -m "Configure for Heroku deployment"
git push heroku main
```

### 4. Initialiser Database
```bash
# Koble til Heroku PostgreSQL
heroku pg:psql

# Kjør SQL-skjemaet
\i backend/schema.sql

# Eller lokalt:
heroku pg:psql < backend/schema.sql
```

### 5. Åpne Applikasjonen
```bash
heroku open
```

## Viktige Filer for Heroku

- **Procfile**: Forteller Heroku hvordan appen skal startes
- **package.json** (root): `heroku-postbuild` script bygger frontend automatisk
- **backend/server.js**: Serverer frontend static files i produksjon
- **frontend/src/services/api.ts**: Bruker relative URL i produksjon

## Kjøre Lokalt (Aligned med Heroku)

```bash
# Installer dependencies
npm run install:all

# Start development mode (separate servere)
npm run dev

# Test production build lokalt
npm run build
cd backend
NODE_ENV=production npm start
# Åpne http://localhost:5001
```

## Debugging på Heroku

```bash
# Se logger
heroku logs --tail

# Kjør kommandoer
heroku run bash

# Restart app
heroku restart
```

## Database Migrasjoner

Når du oppdaterer databaseskjema:

```bash
# Lag en SQL-fil med endringer
# Kjør den på Heroku
heroku pg:psql < migrations/001_update_schema.sql
```

## Monitoring

- **Logs**: `heroku logs --tail`
- **Metrics**: Se Heroku Dashboard
- **Database**: `heroku pg:info`
- **Health Check**: `https://your-app-name.herokuapp.com/health`

