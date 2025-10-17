# Produksjon Delmodul

## Ansvar
Håndterer individuelle produksjoner/arrangementer.

## Struktur
```
produksjon/
├── service.js      # Database-operasjoner for produksjoner
├── controller.js   # HTTP request/response håndtering
├── routes.js       # API-endepunkter og validering
└── README.md       # Denne filen
```

## API Endepunkter

### Produksjoner
- `GET /api/produksjon` - Liste alle produksjoner (med filter)
- `GET /api/produksjon/:id` - Hent produksjon med ID
- `POST /api/produksjon` - Opprett ny produksjon (kun admin)
- `PUT /api/produksjon/:id` - Oppdater produksjon (kun admin)
- `DELETE /api/produksjon/:id` - Slett produksjon (kun admin)
- `GET /api/produksjon/bruker/:userId` - Hent produksjoner for en bruker

## Database-tabell
- `produksjon` - Individuelle produksjoner med navn, tid, beskrivelse, plassering

## Opprettelsesflyt og talent-mal
Ved opprettelse kan request inneholde `kategoriId` og `applyKategoriMal=true`. Backend kopierer data: henter komplett mal (plan, talenter, oppmøtetider) og (om ikke oppgitt) kategoriens `plassering` for å preutfylle produksjonen. Det lagres INGEN fremmednøkkel til kategori på `produksjon` (decoupled modell).

## Eksempel

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
    "planId": 1,
    "applyKategoriMal": true
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
```

## Avhengigheter
- `shared/middleware/auth` - Autentisering og autorisasjon
- `shared/config/database` - Database-tilkobling
- **Tverr-modul:** Kategori (for talent-mal ved opprettelse)
- **Tverr-modul:** Plan (for plan-informasjon)

