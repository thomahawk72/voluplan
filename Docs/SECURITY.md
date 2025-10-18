# Security Measures

Dette dokumentet beskriver sikkerhetstiltakene implementert i Voluplan backend.

## ✅ Implementert Sikkerhet

### 1. Rate Limiting
- **Login**: Maks 5 forsøk per 15 minutter
- **Password Reset**: Maks 3 forsøk per time
- **General API**: Maks 100 requests per 15 minutter

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

### 4. Input Validation & Sanitization
- **express-validator** på alle input-endpoints
- Email normalisering
- Password minimum lengde (8 tegn)
- Parameteriserte SQL queries (SQL injection protection)

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

### 7. Database Security
- Connection pooling med limits
- Prepared statements (parameteriserte queries)
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

## 🚫 Ikke Implementert (Vurder for Produksjon)

- [ ] Helmet.js security headers
- [ ] Request logging (Morgan/Winston)
- [ ] IP whitelisting for admin routes
- [ ] Two-factor authentication (2FA)
- [ ] Password complexity requirements
- [ ] Account lockout etter flere feilede forsøk
- [ ] Audit logging for admin actions
- [ ] Database encryption at rest

## 📚 Referanser

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)


