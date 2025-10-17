# Sikkerhetsaudit av Voluplan Webapplikasjon

Jeg trenger at du gjennomfører en fullstendig sikkerhetsaudit av Voluplan-applikasjonen. 
Du har full tilgang til kode, tester, arkitektur, database og server.

## SCOPE OG MÅL
- Identifiser alle sikkerhetshull og sårbarheter
- Vurder alvorlighetsgrad (Kritisk/Høy/Medium/Lav)
- Test mot OWASP Top 10 og andre kjente angrepsmetoder
- Lever strukturert rapport med konkrete tiltak
- Lag prioritert restanseliste for fixing

## GJENNOMFØRINGSPLAN

### FASE 1: Kartlegging og Arkitektur
1. Les og forstå systemarkitekturen (ARCHITECTURE.md, DATABASE.md, SECURITY.md)
2. Identifiser angrepsflater (API endpoints, forms, auth flows)
3. Map dataflyt (frontend → backend → database)
4. Identifiser eksterne avhengigheter og integrasjoner

### FASE 2: Systematisk Testing

#### A. AUTENTISERING & AUTORISASJON
- OAuth 2.0 implementering (Feide/Google)
- Session management og JWT tokens
- Password reset flow sikkerhet
- Authorization checks (horisontalt/vertikalt access control)
- CSRF protection
- Session timeout og invalidering

#### B. INPUT VALIDERING & INJECTION
- SQL Injection (test alle DB queries)
- XSS (Stored, Reflected, DOM-based)
- Command Injection
- Path Traversal
- API parameter tampering
- File upload validation (hvis relevant)

#### C. API SIKKERHET
- Authentication på alle sensitive endpoints
- Rate limiting effektivitet
- CORS configuration
- API response information leakage
- Mass assignment vulnerabilities
- Error messages (info disclosure)

#### D. DATABASE SIKKERHET
- Parameteriserte queries (prepared statements)
- Least privilege principle
- Sensitive data encryption (passwords, tokens)
- Database connection security
- Migration file security

#### E. KONFIGURASJONS- OG DEPLOYMENT
- Environment variables håndtering
- Secrets management
- Production vs development config
- Logging av sensitive data
- Error handling og stack traces
- Security headers (CSP, HSTS, X-Frame-Options, etc.)

#### F. DEPENDENCIES & SUPPLY CHAIN
- npm audit (kjente sårbarheter)
- Outdated packages
- Dependency confusion risks
- Package integrity

#### G. FRONTEND SIKKERHET
- XSS protection
- Sensitive data i localStorage/sessionStorage
- API keys exposure
- Client-side validation bypass
- React security best practices

#### H. SERVER & INFRASTRUKTUR
- HTTPS enforcement
- Security headers
- Rate limiting
- DDoS protection
- Heroku-specific security

## TESTING METODIKK
1. **Statisk kodeanalyse**: Les gjennom kritisk kode
2. **Dependency scanning**: npm audit, kjente CVE-er
3. **Manual penetration testing**: Simuler faktiske angrep
4. **Configuration review**: Sjekk all konfigurasjon
5. **Documentation review**: Verifiser at security docs er korrekte

## LEVERANSER

### 1. EXECUTIVE SUMMARY
- Overordnet sikkerhetsstatus
- Antall sårbarheter per alvorlighetsgrad
- Kritiske funn som må fikses umiddelbart
- Overall risk score

### 2. DETALJERT RAPPORT
For hver sårbarhet:
- **Tittel**: Kort beskrivelse
- **Alvorlighetsgrad**: Kritisk/Høy/Medium/Lav
- **Kategori**: OWASP-kategori
- **Lokasjon**: Fil og linje
- **Beskrivelse**: Hva er problemet?
- **Exploit scenario**: Hvordan kan det utnyttes?
- **Impact**: Hva er konsekvensene?
- **Remediation**: Konkret løsning
- **Kode-eksempel**: Før og etter
- **Testing**: Hvordan verifisere at det er fikset

### 3. PRIORITERT RESTANSELISTE
Todo-liste strukturert som:
- [ ] KRITISK: [Issue] - Må fikses før prod
- [ ] HØY: [Issue] - Fiks innen 1 uke
- [ ] MEDIUM: [Issue] - Fiks innen 1 måned
- [ ] LAV: [Issue] - Best practice forbedring

### 4. COMPLIANCE CHECKLIST
- [ ] OWASP Top 10 (2021)
- [ ] GDPR relevante punkter
- [ ] Best practices for OAuth 2.0
- [ ] Node.js Security Best Practices
- [ ] React Security Guidelines

## SPESIFIKKE FOKUSOMRÅDER FOR VOLUPLAN
- Brukerautentisering via Feide/Google OAuth
- Produksjonsplanlegging og tilgangskontroll
- Talent/kompetanse data håndtering
- Bemanning og personsensitive data
- API endpoints for produksjon/bruker/kompetanse moduler

## START HER
Begynn med Fase 1 og jobb deg systematisk gjennom alle punkter.
Lag TODO-liste for tracking, og lever kontinuerlig oppdateringer.

---

## HVORDAN BRUKE DENNE PROMPTEN

1. Copy hele denne filen
2. Start en ny chat med Cursor AI
3. Paste prompten og si "Start sikkerhetsaudit"
4. AI vil da systematisk gå gjennom alle punktene
5. Du vil få kontinuerlige oppdateringer underveis
6. Til slutt får du komplett rapport og restanseliste

## FORVENTET OUTPUT

- **SIKKERHETSRAPPORT.md**: Fullstendig sikkerhetsrapport
- **TODO-liste**: Prioriterte oppgaver som må gjøres
- **Kodeendringer**: Konkrete fixes for kritiske sårbarheter

