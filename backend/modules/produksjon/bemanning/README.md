# Bemanning Delmodul

## Ansvar
Håndterer bemanning av produksjoner - kobling mellom personer og produksjoner med talents.

## Struktur
```
bemanning/
├── service.js      # Database-operasjoner for bemanning
├── controller.js   # HTTP request/response håndtering
├── routes.js       # API-endepunkter og validering
└── README.md       # Denne filen
```

## API Endepunkter

### Bemanning
- `GET /api/produksjon/:id/bemanning` - Hent bemanning for produksjon
- `POST /api/produksjon/:id/bemanning` - Legg til person (kun admin)
- `PUT /api/produksjon/:id/bemanning/:bemanningId` - Oppdater bemanning (kun admin)
- `DELETE /api/produksjon/:id/bemanning/:bemanningId` - Fjern person (kun admin)

## Database-tabell
- `produksjon_bemanning` - Kobling mellom produksjoner, personer og talents

## Data Struktur
```javascript
// POST /api/produksjon/:id/bemanning
{
  "personId": 1,
  "talentId": 1,        // OBS: talentId, ikke kompetanseId
  "notater": "Ansvarlig",
  "status": "bekreftet"
}

// Response
{
  "id": 1,
  "produksjon_id": 1,
  "person_id": 1,
  "talent_id": 1,
  "talent_navn": "FOH Lyd",
  "talent_kategori": "Lyd → Band",  // Hierarkisk kategori-navn
  "status": "bekreftet"
}
```

## Eksempel

### Legg til bemanning
```bash
curl -X POST http://localhost:5001/api/produksjon/1/bemanning \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "personId": 2,
    "talentId": 3,
    "status": "planlagt",
    "notater": "Ansvarlig for hovedlyd"
  }'
```

## Avhengigheter
- `shared/middleware/auth` - Autentisering og autorisasjon
- `shared/config/database` - Database-tilkobling
- **Tverr-modul:** Brukermodul (for bemanningsinformasjon)
- **Tverr-modul:** Talentmodul (for talent-informasjon)

