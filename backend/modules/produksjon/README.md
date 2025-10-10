# Produksjonsmodul

## Ansvar
Håndterer produksjonsplaner, produksjonskategorier, produksjoner og bemanningsplanlegging.

## Struktur
```
produksjon/
├── service.js      # Database-operasjoner og business logic
├── controller.js   # HTTP request/response håndtering
├── routes.js       # API-endepunkter og validering
└── __tests__/      # Tester for modulen
```

## API Endepunkter

### Produksjonsplaner
- `GET /api/produksjon/planer` - Liste alle planer
- `GET /api/produksjon/planer/:id` - Hent plan med ID
- `POST /api/produksjon/planer` - Opprett ny plan (kun admin)
- `PUT /api/produksjon/planer/:id` - Oppdater plan (kun admin)
- `DELETE /api/produksjon/planer/:id` - Slett plan (kun admin)

### Produksjonskategorier
- `GET /api/produksjon/kategorier` - Liste alle kategorier
- `GET /api/produksjon/kategorier/:id` - Hent kategori med ID
- `POST /api/produksjon/kategorier` - Opprett ny kategori (kun admin)
- `PUT /api/produksjon/kategorier/:id` - Oppdater kategori (kun admin)
- `DELETE /api/produksjon/kategorier/:id` - Slett kategori (kun admin)

### Produksjoner
- `GET /api/produksjon` - Liste alle produksjoner (med filter)
- `GET /api/produksjon/:id` - Hent produksjon med ID
- `POST /api/produksjon` - Opprett ny produksjon (kun admin)
- `PUT /api/produksjon/:id` - Oppdater produksjon (kun admin)
- `DELETE /api/produksjon/:id` - Slett produksjon (kun admin)
- `GET /api/produksjon/bruker/:userId` - Hent produksjoner for en bruker

### Bemanning
- `GET /api/produksjon/:id/bemanning` - Hent bemanning for produksjon
- `POST /api/produksjon/:id/bemanning` - Legg til person (kun admin)
- `PUT /api/produksjon/:id/bemanning/:bemanningId` - Oppdater bemanning (kun admin)
- `DELETE /api/produksjon/:id/bemanning/:bemanningId` - Fjern person (kun admin)

## Database-tabeller
- `produksjonsplan` - Overordnede planer
- `produksjonskategori` - Kategorier for produksjoner
- `produksjon` - Individuelle produksjoner
- `produksjon_bemanning` - Kobling mellom produksjoner og personer

## Avhengigheter
- `shared/middleware/auth` - Autentisering og autorisasjon
- `shared/config/database` - Database-tilkobling
- **Tverr-modul:** Brukermodul (for bemanningsinformasjon)
- **Tverr-modul:** Kompetansemodul (for bemanningsinformasjon)

## Eksempler

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

### Opprett produksjon
```bash
curl -X POST http://localhost:5001/api/produksjon \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "navn": "Sommershow 2025",
    "tid": "2025-06-15T19:00:00Z",
    "kategoriId": 1,
    "publisert": false,
    "beskrivelse": "Årets store sommershow",
    "planId": 1
  }'
```

### Liste produksjoner med filter
```bash
# Kommende produksjoner
curl "http://localhost:5001/api/produksjon?kommende=true" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Gjennomførte produksjoner
curl "http://localhost:5001/api/produksjon?gjennomfort=true" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Produksjoner i en kategori
curl "http://localhost:5001/api/produksjon?kategoriId=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Legg til bemanning
```bash
curl -X POST http://localhost:5001/api/produksjon/1/bemanning \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "personId": 2,
    "kompetanseId": 3,
    "status": "planlagt",
    "notater": "Ansvarlig for hovedlyd"
  }'
```


