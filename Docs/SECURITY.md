# Security Measures

Dette dokumentet beskriver sikkerhetstiltakene implementert i Voluplan backend.

## ✅ Implementert Sikkerhet

### 1. Rate Limiting
- **Login**: Maks 5 forsøk per 15 minutter
- **Password Reset**: Maks 3 forsøk per time
- **General API**: Maks 100 requests per 15 minutter
- **🆕 Mutation Operations** (2025-10-18 Sprint 3): Maks 20 requests per 15 minutter
  - Bulk delete operations
  - Produksjon creation (expensive due to template copying)
  - Protected against DoS via resource exhaustion

### 2. Authentication & Authorization
- **JWT tokens** i httpOnly cookies
- **bcrypt** for password hashing (10 rounds)
- **Role-based access control** (RBAC)
- Token expiration (7 dager default)

### 3. CSRF Protection
- **httpOnly cookies**: Forhindrer XSS-baserte token-tyverier
- **SameSite='lax'**: Cookies sendes ikke på cross-site POST requests
- **CORS konfigurert**: Kun tillatte origins kan gjøre requests
- **Ingen localStorage**: Unngår XSS-sårbarhet

### 4. Input Validation & Sanitization (2025-10-18 Sprint 3: Audit fullført ✅)
- **express-validator** på alle mutation endpoints (100% coverage)
  - POST /api/users, /api/kompetanse, /api/produksjon, osv.
  - PUT endpoints med optional field validation
  - PATCH endpoints med specific field validation
- Email normalisering og validering
- Password minimum lengde (8 tegn)
- Integer validation med min/max constraints
- Enum validation (type, status fields)
- Array validation (bulk operations)
- ISO8601 date validation
- String trimming og sanitization
- **Se:** `backend/INPUT_VALIDATION_AUDIT.md` for fullstendig rapport

### 5. Error Handling
- Standardiserte error responses
- Ingen sensitive data i error messages
- Database errors logger ikke crasher serveren
- Stack traces kun i development mode

### 6. Environment Validation
- Sjekker at alle påkrevde env-variabler er satt ved oppstart
- **🆕 JWT_SECRET validering i production**: Krever sterkt secret (min 32 tegn)
- **🆕 Demo-secret detektion**: Blokkerer kjente svake secrets i production
- Advarer om manglende optional konfigurasjoner
- Feilmelding med liste over manglende variabler

### 7. Database Security (2025-10-18 Sprint 3: SQL Injection audit fullført ✅)
- Connection pooling med limits
- **Prepared statements (parameteriserte queries)** - 100% av alle queries
  - Alle dynamic queries bruker `$1`, `$2` placeholders
  - Ingen string interpolation av brukerinput
  - ORDER BY clauses er hardkodet
  - **Se:** `backend/SQL_INJECTION_REVIEW.md` for fullstendig audit
- Separate database user med least privilege
- Connection timeout konfigurert

### 8. 🆕 Security Headers (Helmet.js)
- **Content-Security-Policy (CSP)**: Blokkerer inline scripts, kun tillater self
- **X-Frame-Options**: DENY - forhindrer clickjacking
- **X-Content-Type-Options**: nosniff - forhindrer MIME sniffing
- **Strict-Transport-Security (HSTS)**: 1 år max-age, includeSubDomains, preload
- **X-XSS-Protection**: Aktivert
- **Permissions-Policy**: Begrenset tilgang til browser features

### 9. 🆕 Horizontal Access Control (2025-10-18)
- **checkResourceOwnership middleware**: Sikrer at brukere kun kan aksessere egne ressurser
- **Beskyttede endpoints**:
  - GET/PUT /api/users/:id - Kun admin eller brukeren selv
  - GET /api/users/:id/talents - Kun admin eller brukeren selv
  - GET /api/produksjon/bruker/:userId - Kun admin eller brukeren selv
- **Admin bypass**: Admin-rolle har tilgang til alle ressurser
- **Logging**: Uautoriserte forsøk logges med warning

## 🔒 Best Practices

### Password Policy
- Minimum 8 tegn
- Hashing med bcrypt (10 rounds)
- Password reset tokens gyldig i 1 time
- Tokens markeres som brukt etter reset

### Session Management
- JWT tokens i httpOnly cookies
- Secure flag i production
- SameSite='lax' for CSRF protection
- 7 dagers expiration

### OAuth Security
- State parameter for CSRF protection (håndtert av Passport.js)
- Brukere må være pre-registrert
- OAuth accounts linkes til eksisterende brukere

## ⚠️ Anbefalinger for Produksjon

1. **HTTPS**: Sett `secure: true` på cookies (allerede konfigurert for production)
2. **Helmet.js**: Legg til security headers
3. **Logging**: Implementer Winston eller lignende for structured logging
4. **Monitoring**: Sett opp Sentry eller lignende for error tracking
5. **Database**: Bruk SSL/TLS for database-tilkoblinger
6. **Secrets**: Bruk secrets manager (AWS Secrets Manager, Azure Key Vault, etc.)
7. **Updates**: Hold dependencies oppdatert (`npm audit`)

### 10. 🆕 CSRF Protection (2025-10-18 Sprint 3: Tester opprettet, venter implementasjon)
- **Status:** ⏳ Infrastruktur klar, venter på koordinert deploy
- **Tester opprettet:** `backend/__tests__/middleware/csrf.test.js` (7/7 passerer)
- **Package installert:** `csurf@1.11.0`
- **Implementasjon venter på:**
  - Frontend axios interceptor for X-CSRF-Token header
  - Backend csrf middleware aktivering
  - Koordinert deploy (breaking change)

## 🚫 Ikke Implementert (Vurder for Produksjon)

- [ ] ✅ ~~Helmet.js security headers~~ ✅ IMPLEMENTERT (Sprint 1)
- [ ] ✅ ~~Mutation rate limiting~~ ✅ IMPLEMENTERT (Sprint 3)
- [ ] ✅ ~~SQL injection review~~ ✅ FULLFØRT (Sprint 3)
- [ ] ✅ ~~Input validation audit~~ ✅ FULLFØRT (Sprint 3)
- [ ] ⏳ CSRF token validation (infrastruktur klar, venter deploy)
- [ ] Request logging (Morgan/Winston)
- [ ] IP whitelisting for admin routes
- [ ] Two-factor authentication (2FA)
- [ ] Password complexity requirements (vurder zxcvbn)
- [ ] Account lockout etter flere feilede forsøk
- [ ] Audit logging for admin actions
- [ ] Database encryption at rest

## 📚 Referanser

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)


