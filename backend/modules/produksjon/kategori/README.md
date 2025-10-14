# Kategori Delmodul

## Ansvar
Håndterer produksjonskategorier og talent-maler for kategorier.

## Struktur
```
kategori/
├── service.js      # Database-operasjoner for kategorier og talent-maler
├── controller.js   # HTTP request/response håndtering
├── routes.js       # API-endepunkter og validering
└── README.md       # Denne filen
```

## API Endepunkter

### Kategorier
- `GET /api/produksjon/kategorier` - Liste alle kategorier
- `GET /api/produksjon/kategorier/:id` - Hent kategori med ID
- `POST /api/produksjon/kategorier` - Opprett ny kategori (kun admin)
- `PUT /api/produksjon/kategorier/:id` - Oppdater kategori (kun admin)
- `DELETE /api/produksjon/kategorier/:id` - Slett kategori (kun admin)

### Talent-maler
- `GET /api/produksjon/kategorier/:id/talent-mal` - Hent talent-mal for kategori
- `POST /api/produksjon/kategorier/:id/talent-mal` - Legg til talent i mal (kun admin)
- `PUT /api/produksjon/kategorier/:id/talent-mal/:malId` - Oppdater talent i mal (kun admin)
- `DELETE /api/produksjon/kategorier/:id/talent-mal/:malId` - Fjern talent fra mal (kun admin)

## Database-tabeller
- `produksjonskategori` - Kategorier med navn, beskrivelse, plassering
- `produksjonskategori_talent_mal` - Talent-maler per kategori

## Talent-mal funksjonalitet
Produksjonskategorier kan ha en forhåndsdefinert mal av talenter med antall (f.eks. "Teaterforestilling" kan ha 2x Lydtekniker, 1x Piano, 2x Lysoperatør). Når en produksjon opprettes med en kategori, kan malen anvendes for å preutfylle bemanning.

## Eksempel

### Opprett kategori
```bash
curl -X POST http://localhost:5001/api/produksjon/kategorier \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "navn": "Teaterforestilling",
    "beskrivelse": "Standard teaterforestilling",
    "plassering": "Hovedscenen"
  }'
```

### Legg til talent i mal
```bash
curl -X POST http://localhost:5001/api/produksjon/kategorier/1/talent-mal \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "talentId": 3,
    "antall": 2,
    "beskrivelse": "Hovedlyd og monitormix"
  }'
```

## Avhengigheter
- `shared/middleware/auth` - Autentisering og autorisasjon
- `shared/config/database` - Database-tilkobling
- **Tverr-modul:** Talentmodul (for talent-informasjon i maler)

