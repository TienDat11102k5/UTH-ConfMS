# Security Configuration Guide

**Project:** UTH-ConfMS (Conference Management System)  
**Last Updated:** December 25, 2025  
**Status:** ✅ Production Ready

---

## 🔒 Overview

This document describes the security configuration and best practices implemented in UTH-ConfMS backend system.

## 🛡️ Security Features

### 1. Authentication & Authorization

#### JWT-Based Authentication
- **Token Type:** JSON Web Token (JWT)
- **Algorithm:** HS256 (HMAC with SHA-256)
- **Access Token Lifetime:** 60 minutes (configurable)
- **Refresh Token Lifetime:** 7 days (configurable)

```properties
# JWT Configuration
app.jwt.secret=YOUR_SECRET_KEY_AT_LEAST_32_CHARACTERS
app.jwt.access-token-minutes=60
app.jwt.refresh-token-days=7
```

#### Role-Based Access Control (RBAC)
The system implements 5 user roles with hierarchical permissions:

| Role | Code | Permissions |
|------|------|-------------|
| Admin | `ROLE_ADMIN` | Full system access, user management |
| Chair | `ROLE_CHAIR` | Conference management, decisions, reports |
| Track Chair | `ROLE_TRACK_CHAIR` | Track-level management, limited decisions |
| Reviewer | `ROLE_REVIEWER` | Review assigned papers |
| PC (Program Committee) | `ROLE_PC` | Review + committee privileges |
| Author | `ROLE_AUTHOR` | Submit papers, view own submissions |

### 2. Spring Security Configuration

#### SecurityConfig.java
Located at: `backend/src/main/java/edu/uth/backend/config/SecurityConfig.java`

**Key Features:**
- ✅ Stateless session management (no server-side sessions)
- ✅ JWT filter for all authenticated endpoints
- ✅ CSRF disabled (REST API with JWT)
- ✅ Method-level security with `@PreAuthorize`
- ✅ Configurable CORS

```java
@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
```

### 3. CORS Configuration

#### Production-Ready CORS Setup

**Location:** `SecurityConfig.java` → `corsConfigurationSource()`

**Configuration:**
```properties
# Single origin
app.cors.allowed-origins=http://localhost:5173

# Multiple origins (comma-separated)
app.cors.allowed-origins=http://localhost:5173,https://confms.uth.edu.vn
```

**Allowed Methods:**
- GET
- POST
- PUT
- PATCH
- DELETE
- OPTIONS

**Security Notes:**
- ✅ Credentials allowed (for cookie-based authentication if needed)
- ✅ Authorization header exposed
- ✅ All headers allowed for development (restrict in production)
- ❌ Wildcard `*` NOT allowed (removed from all controllers)

### 4. Password Security

#### Password Policy
- **Minimum Length:** 6 characters (configurable)
- **Encoding:** BCrypt (Blowfish cipher)
- **Strength:** 10 rounds (BCrypt default)

```java
@Bean
PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}
```

#### Password Reset Flow
1. User requests reset → Email sent with OTP
2. OTP verification (5-minute expiration)
3. Reset token issued (15-minute expiration)
4. Password reset with token

**Configuration:**
```properties
app.reset-password.otp-ttl-minutes=5
app.reset-password.token-ttl-minutes=15
```

### 5. Endpoint Security

All API endpoints are protected with `@PreAuthorize` annotations:

#### Public Endpoints (No Authentication)
```java
// Authentication endpoints
POST /api/auth/register
POST /api/auth/login
POST /api/auth/forgot-password
POST /api/auth/verify-otp
POST /api/auth/reset-password

// Public conference listings
GET /api/conferences
GET /api/conferences/{id}

// Public proceedings
GET /api/proceedings/**
```

#### Authenticated Endpoints
```java
// User profile (any authenticated user)
@PreAuthorize("isAuthenticated()")
GET /api/user/profile
PUT /api/user/profile
POST /api/user/upload-avatar
PUT /api/user/change-password

// Paper submissions (authenticated + ownership check)
@PreAuthorize("isAuthenticated()")
POST /api/submissions
GET /api/submissions/{id}
PUT /api/submissions/{id}
```

#### Role-Based Endpoints
```java
// Admin/Chair only
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_CHAIR')")
POST /api/conferences
PUT /api/conferences/{id}
DELETE /api/conferences/{id}

// Reviewer/PC only
@PreAuthorize("hasAnyAuthority('ROLE_REVIEWER','ROLE_PC')")
POST /api/reviews

// Chair/Track Chair (decision making)
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_CHAIR','ROLE_TRACK_CHAIR')")
POST /api/decisions
GET /api/reports/conference/{id}
```

---

## 🚀 Deployment Checklist

### Environment Variables

**Required for Production:**
```bash
# Server
SERVER_PORT=8080

# Database
SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/confms_db
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=<STRONG_PASSWORD>

# JWT Security
JWT_SECRET=<GENERATE_STRONG_SECRET_AT_LEAST_32_CHARS>
JWT_ACCESS_MINUTES=60
JWT_REFRESH_DAYS=7

# CORS
CORS_ALLOWED_ORIGINS=https://confms.uth.edu.vn

# Firebase (for Google OAuth)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CREDENTIALS=/path/to/service-account.json

# Email (for OTP)
MAIL_HOST=smtp.gmail.com
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=<APP_PASSWORD>

# AI Service (optional)
GEMINI_API_KEY=<YOUR_GEMINI_KEY>
```

### Security Hardening Steps

#### 1. Generate Strong JWT Secret
```bash
# Generate 64-character random string
openssl rand -base64 64 | tr -d '\n'
```

#### 2. Configure HTTPS
- Use reverse proxy (nginx) with SSL/TLS
- Redirect HTTP to HTTPS
- Set `Strict-Transport-Security` header

#### 3. Rate Limiting (Recommended)
Add rate limiting to prevent brute force attacks:

**Suggested Endpoints:**
- `/api/auth/login` - Max 5 attempts per minute per IP
- `/api/auth/register` - Max 3 attempts per hour per IP
- `/api/auth/forgot-password` - Max 3 attempts per hour per email

**Implementation Options:**
- Spring Cloud Gateway (if using microservices)
- Bucket4j (in-memory or Redis)
- Nginx rate limiting

#### 4. Database Security
```sql
-- Create separate database user with limited privileges
CREATE USER confms_app WITH PASSWORD 'strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO confms_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO confms_app;

-- Revoke superuser privileges
REVOKE ALL PRIVILEGES ON DATABASE confms_db FROM PUBLIC;
```

#### 5. File Upload Security
Currently implemented:
- ✅ File size limit: 100MB
- ✅ File type validation (PDF for papers)
- ✅ Secure file naming (UUID-based)

**Additional Recommendations:**
- Virus scanning for uploaded files
- Content-Type validation
- Separate storage bucket for uploads

#### 6. Logging & Monitoring
Enable security logging:

```properties
# Audit logging
logging.level.org.springframework.security=DEBUG
logging.level.edu.uth.backend.security=DEBUG

# Log all authentication attempts
logging.level.org.springframework.security.authentication=INFO
```

**Log Events to Monitor:**
- Failed login attempts
- Password changes
- Role changes
- Permission denials
- API errors (4xx, 5xx)

---

## 🔍 Security Audit Results

**Audit Date:** December 25, 2025  
**Total Endpoints:** 41  
**Security Coverage:** 100%

### Issues Fixed
1. ✅ **Missing @PreAuthorize annotations** - 13 endpoints fixed
2. ✅ **CORS wildcard misconfiguration** - Removed from 6 controllers
3. ✅ **Manual auth checks** - Replaced with framework-level security

### Current Status
- ✅ All endpoints properly secured
- ✅ RBAC correctly implemented
- ✅ CORS restricted to configured origins
- ✅ No public endpoints exposing sensitive data

**Full Audit Report:** See [SECURITY_AUDIT_REPORT.md](../SECURITY_AUDIT_REPORT.md)

---

## 🧪 Testing Security

### Manual Testing

#### 1. Test Authentication
```bash
# Register new user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User"
  }'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Response contains JWT token
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "tokenType": "Bearer"
}
```

#### 2. Test Authorization
```bash
# Access protected endpoint WITHOUT token (should fail)
curl -X GET http://localhost:8080/api/user/profile

# Access with token (should succeed)
curl -X GET http://localhost:8080/api/user/profile \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

# Access admin endpoint as regular user (should fail)
curl -X POST http://localhost:8080/api/conferences \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Conference"}'
```

#### 3. Test CORS
```bash
# Preflight request
curl -X OPTIONS http://localhost:8080/api/conferences \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST"

# Should return CORS headers:
# Access-Control-Allow-Origin: http://localhost:5173
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

### Automated Testing

See integration tests in:
- `backend/src/test/java/.../integration/test_auth_workflow.py`
- `backend/src/test/java/.../integration/test_governance.py`

---

## 📚 References

- [Spring Security Documentation](https://docs.spring.io/spring-security/reference/index.html)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CORS Configuration](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

## 🆘 Troubleshooting

### Common Issues

#### 1. CORS Errors in Browser
**Symptom:** `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Solution:**
1. Check `app.cors.allowed-origins` in `application.properties`
2. Ensure frontend URL matches exactly (including protocol and port)
3. Verify SecurityConfig has correct CORS configuration
4. Clear browser cache

#### 2. 401 Unauthorized
**Symptom:** API returns 401 even with valid token

**Possible Causes:**
- Token expired (check expiration time)
- Invalid JWT secret (must match between instances)
- Token not in `Authorization: Bearer <token>` format
- JwtAuthFilter not registered properly

**Solution:**
```bash
# Verify token is valid
curl -X GET http://localhost:8080/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -v

# Check server logs for JWT parsing errors
```

#### 3. 403 Forbidden
**Symptom:** API returns 403 with valid token

**Cause:** User lacks required role for endpoint

**Solution:**
1. Check user roles in database
2. Verify `@PreAuthorize` annotation matches user authority
3. Check if `ROLE_` prefix is present in authorities

```sql
-- Check user roles
SELECT u.email, r.name 
FROM users u 
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'test@example.com';
```

#### 4. Password Reset Not Working
**Possible Issues:**
- SMTP configuration incorrect
- Gmail App Password not set
- OTP expired (5-minute window)
- Redis not running (if using Redis for OTP storage)

**Solution:**
1. Test email configuration:
```bash
# Check SMTP settings in application.properties
spring.mail.host=smtp.gmail.com
spring.mail.username=your-email@gmail.com
spring.mail.password=<16-CHAR-APP-PASSWORD>
```

2. Generate Gmail App Password:
   - Visit: https://myaccount.google.com/apppasswords
   - Create new app password
   - Copy 16-character password (no spaces)

---

## 📞 Contact

For security-related issues or questions:
- **Security Team:** security@uth.edu.vn
- **Project Repository:** [GitHub Issues](https://github.com/your-org/UTH-ConfMS/issues)
- **Emergency:** Contact system administrator immediately

---

**Document Version:** 1.0  
**Last Review:** December 25, 2025  
**Next Review:** March 25, 2026
