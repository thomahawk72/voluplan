# Plan Delmodul

## Ansvar
Håndterer produksjonsplaner - overordnede tidsperioder som produksjoner kan knyttes til.

## Struktur
```
plan/
├── service.js      # Database-operasjoner for planer
├── controller.js   # HTTP request/response håndtering
├── routes.js       # API-endepunkter og validering
└── README.md       # Denne filen
```

## API Endepunkter

### Planer
- `GET /api/produksjon/planer` - Liste alle planer
- `GET /api/produksjon/planer/:id` - Hent plan med ID
- `POST /api/produksjon/planer` - Opprett ny plan (kun admin)
- `PUT /api/produksjon/planer/:id` - Oppdater plan (kun admin)
- `DELETE /api/produksjon/planer/:id` - Slett plan (kun admin)

## Database-tabell
- `produksjonsplan` - Planer med navn, beskrivelse, start/slutt dato

## Eksempel

### Opprett plan
```bash
curl -X POST http://localhost:5001/api/produksjon/planer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "navn": "Vårsesongen 2025",
    "beskrivelse": "Planlagte forestillinger for våren",
    "startDato": "2025-03-01",
    "sluttDato": "2025-05-31"
  }'
```

## Avhengigheter
- `shared/middleware/auth` - Autentisering og autorisasjon
- `shared/config/database` - Database-tilkobling

