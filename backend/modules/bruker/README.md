# Brukermodul

## Ansvar
Håndterer all funksjonalitet relatert til brukere, autentisering og autorisasjon.

## Struktur
```
bruker/
├── service.js      # Database-operasjoner og business logic
├── controller.js   # HTTP request/response håndtering
├── routes.js       # API-endepunkter og validering
└── __tests__/      # Tester for modulen
```

## API Endepunkter

### Autentisering
- `POST /api/auth/login` - Logg inn med e-post og passord
- `POST /api/auth/logout` - Logg ut bruker
- `GET /api/auth/me` - Hent innlogget bruker
- `POST /api/auth/forgot-password` - Be om passordtilbakestilling
- `POST /api/auth/reset-password` - Tilbakestill passord med token

### OAuth
- `GET /api/auth/google` - Initier Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/facebook` - Initier Facebook OAuth
- `GET /api/auth/facebook/callback` - Facebook OAuth callback

### Brukeradministrasjon
- `GET /api/users` - Liste alle brukere (kun admin)
- `GET /api/users/:id` - Hent bruker med ID
- `POST /api/users` - Opprett ny bruker (kun admin)
- `PUT /api/users/:id` - Oppdater bruker
- `DELETE /api/users/:id` - Slett bruker (kun admin)

## Database-tabeller
- `users` - Brukerdata
- `password_reset_tokens` - Tokens for passordtilbakestilling

## Avhengigheter
- `shared/middleware/auth` - Autentisering og autorisasjon
- `shared/middleware/rateLimiter` - Rate limiting
- `shared/config/passport` - OAuth strategier
- `shared/services/emailService` - E-postutsending
- `shared/utils/userMapper` - Mapping av brukerdata

## Eksempler

### Logg inn
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "passord123"}'
```

### Opprett bruker (admin)
```bash
curl -X POST http://localhost:5001/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "firstName": "Ole",
    "lastName": "Nordmann",
    "email": "ole@example.com",
    "roles": ["user"]
  }'
```

### Liste brukere
```bash
curl http://localhost:5001/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```


