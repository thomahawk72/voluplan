# Kompetansemodul

## Ansvar
Håndterer kompetansekategorier og kompetanser, samt tilknytninger mellom personer og kompetanser.

## Struktur
```
kompetanse/
├── service.js      # Database-operasjoner og business logic
├── controller.js   # HTTP request/response håndtering
├── routes.js       # API-endepunkter og validering
└── __tests__/      # Tester for modulen
```

## API Endepunkter

### Kompetansekategorier
- `GET /api/kompetanse/kategorier` - Liste alle kategorier
- `GET /api/kompetanse/kategorier/:id` - Hent kategori med ID
- `POST /api/kompetanse/kategorier` - Opprett ny kategori (kun admin)
- `PUT /api/kompetanse/kategorier/:id` - Oppdater kategori (kun admin)
- `DELETE /api/kompetanse/kategorier/:id` - Slett kategori (kun admin)

### Kompetanser
- `GET /api/kompetanse` - Liste alle kompetanser (med filter: ?kategoriId=X&lederId=Y)
- `GET /api/kompetanse/:id` - Hent kompetanse med ID
- `POST /api/kompetanse` - Opprett ny kompetanse (kun admin)
- `PUT /api/kompetanse/:id` - Oppdater kompetanse (kun admin)
- `DELETE /api/kompetanse/:id` - Slett kompetanse (kun admin)
- `GET /api/kompetanse/bruker/:userId` - Hent kompetanser for en bruker
- `GET /api/kompetanse/:id/brukere` - Hent brukere med en spesifikk kompetanse

## Database-tabeller
- `kompetansekategori` - Kategorier for kompetanser
- `kompetanse` - Spesifikke kompetanser

## Avhengigheter
- `shared/middleware/auth` - Autentisering og autorisasjon
- `shared/config/database` - Database-tilkobling
- **Tverr-modul:** Brukermodul (for leder-informasjon)

## Eksempler

### Liste kategorier
```bash
curl http://localhost:5001/api/kompetanse/kategorier \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Opprett kategori
```bash
curl -X POST http://localhost:5001/api/kompetanse/kategorier \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "navn": "Lyd",
    "beskrivelse": "Lydteknisk kompetanse"
  }'
```

### Opprett kompetanse
```bash
curl -X POST http://localhost:5001/api/kompetanse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "navn": "Lydtekniker",
    "kategoriId": 1,
    "lederId": 2,
    "beskrivelse": "Ansvarlig for lydanlegg"
  }'
```

### Liste kompetanser med filter
```bash
# Alle kompetanser i en kategori
curl "http://localhost:5001/api/kompetanse?kategoriId=1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Alle kompetanser med en spesifikk leder
curl "http://localhost:5001/api/kompetanse?lederId=2" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Hent kompetanser for en bruker
```bash
curl http://localhost:5001/api/kompetanse/bruker/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```


