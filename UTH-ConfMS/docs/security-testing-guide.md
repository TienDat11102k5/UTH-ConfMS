# Security Testing Guide

**Project:** UTH-ConfMS  
**Purpose:** Comprehensive security testing procedures  
**Last Updated:** December 25, 2025

---

## 📋 Testing Overview

This guide provides step-by-step instructions for testing all security aspects of the UTH-ConfMS system.

---

## 🎯 Test Categories

1. **Authentication Testing** - Login, registration, token validation
2. **Authorization Testing** - Role-based access control
3. **CORS Testing** - Cross-origin resource sharing
4. **Input Validation** - SQL injection, XSS prevention
5. **Session Management** - Token expiration, refresh
6. **Password Security** - Reset flow, encryption

---

## 🔐 1. Authentication Testing

### Test Case 1.1: User Registration
**Objective:** Verify new users can register successfully

```bash
# Valid registration
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "securePass123",
    "fullName": "Test User",
    "affiliation": "Test University"
  }'

# Expected: 200 OK with user data
```

**Test Scenarios:**
- ✅ Valid registration
- ❌ Duplicate email (should return 400)
- ❌ Weak password (should return 400)
- ❌ Invalid email format (should return 400)
- ❌ Missing required fields (should return 400)

### Test Case 1.2: User Login
**Objective:** Verify users can login with correct credentials

```bash
# Valid login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "securePass123"
  }'

# Expected: 200 OK with JWT tokens
# {
#   "accessToken": "eyJhbGc...",
#   "refreshToken": "eyJhbGc...",
#   "tokenType": "Bearer",
#   "expiresIn": 3600
# }
```

**Test Scenarios:**
- ✅ Valid credentials
- ❌ Wrong password (should return 401)
- ❌ Non-existent email (should return 401)
- ❌ Empty credentials (should return 400)

### Test Case 1.3: Token Validation
**Objective:** Verify JWT token is validated on protected endpoints

```bash
# Without token (should fail)
curl -X GET http://localhost:8080/api/user/profile

# Expected: 401 Unauthorized

# With invalid token (should fail)
curl -X GET http://localhost:8080/api/user/profile \
  -H "Authorization: Bearer invalid_token_here"

# Expected: 401 Unauthorized

# With valid token (should succeed)
curl -X GET http://localhost:8080/api/user/profile \
  -H "Authorization: Bearer <VALID_TOKEN>"

# Expected: 200 OK with user profile
```

### Test Case 1.4: Token Expiration
**Objective:** Verify expired tokens are rejected

```bash
# Wait for token to expire (default: 60 minutes)
# Or use an old token

curl -X GET http://localhost:8080/api/user/profile \
  -H "Authorization: Bearer <EXPIRED_TOKEN>"

# Expected: 401 Unauthorized
# Error message: "Token expired"
```

---

## 🛡️ 2. Authorization Testing (RBAC)

### Test Case 2.1: Admin-Only Endpoints
**Objective:** Verify only admins can access admin endpoints

```bash
# Create conference (requires ADMIN or CHAIR)
# Test as regular user (should fail)
curl -X POST http://localhost:8080/api/conferences \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Conference",
    "description": "Testing access control"
  }'

# Expected: 403 Forbidden

# Test as admin (should succeed)
curl -X POST http://localhost:8080/api/conferences \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Conference",
    "description": "Testing access control"
  }'

# Expected: 200 OK
```

### Test Case 2.2: Reviewer Endpoints
**Objective:** Verify only reviewers can submit reviews

```bash
# Submit review as author (should fail)
curl -X POST http://localhost:8080/api/reviews \
  -H "Authorization: Bearer <AUTHOR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "assignmentId": 1,
    "overallRating": 8,
    "confidence": 4,
    "commentForChair": "Good paper",
    "commentForAuthor": "Minor revisions needed"
  }'

# Expected: 403 Forbidden

# Submit review as reviewer (should succeed)
curl -X POST http://localhost:8080/api/reviews \
  -H "Authorization: Bearer <REVIEWER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "assignmentId": 1,
    "overallRating": 8,
    "confidence": 4,
    "commentForChair": "Good paper",
    "commentForAuthor": "Minor revisions needed"
  }'

# Expected: 200 OK
```

### Test Case 2.3: Chair Decision Making
**Objective:** Verify only chairs can make paper decisions

```bash
# Make decision as reviewer (should fail)
curl -X POST http://localhost:8080/api/decisions \
  -H "Authorization: Bearer <REVIEWER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "paperId": 1,
    "status": "ACCEPTED",
    "comment": "Excellent work"
  }'

# Expected: 403 Forbidden

# Make decision as chair (should succeed)
curl -X POST http://localhost:8080/api/decisions \
  -H "Authorization: Bearer <CHAIR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "paperId": 1,
    "status": "ACCEPTED",
    "comment": "Excellent work"
  }'

# Expected: 200 OK
```

### Test Case 2.4: Ownership Validation
**Objective:** Verify users can only modify their own resources

```bash
# User A creates a submission
curl -X POST http://localhost:8080/api/submissions \
  -H "Authorization: Bearer <USER_A_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "User A Paper",
    "abstract": "This is User A paper"
  }'

# Response: {"id": 123, ...}

# User B tries to modify User A submission (should fail)
curl -X PUT http://localhost:8080/api/submissions/123 \
  -H "Authorization: Bearer <USER_B_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Modified by User B"
  }'

# Expected: 403 Forbidden
```

---

## 🌐 3. CORS Testing

### Test Case 3.1: Allowed Origin
**Objective:** Verify requests from allowed origins are accepted

```bash
# Preflight request from allowed origin
curl -X OPTIONS http://localhost:8080/api/conferences \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Authorization,Content-Type"

# Expected headers in response:
# Access-Control-Allow-Origin: http://localhost:5173
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
# Access-Control-Allow-Headers: Authorization, Content-Type
# Access-Control-Allow-Credentials: true
```

### Test Case 3.2: Blocked Origin
**Objective:** Verify requests from non-allowed origins are blocked

```bash
# Request from disallowed origin
curl -X OPTIONS http://localhost:8080/api/conferences \
  -H "Origin: http://evil.com" \
  -H "Access-Control-Request-Method: POST"

# Expected: No CORS headers or error
```

---

## 🔒 4. Input Validation Testing

### Test Case 4.1: SQL Injection Prevention
**Objective:** Verify SQL injection attempts are blocked

```bash
# Attempt SQL injection in login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com OR 1=1--",
    "password": "anything"
  }'

# Expected: 401 Unauthorized (not SQL error)

# Attempt SQL injection in search
curl -X GET "http://localhost:8080/api/conferences?search=test' OR '1'='1" \
  -H "Authorization: Bearer <TOKEN>"

# Expected: Empty results or 400 Bad Request (not SQL error)
```

### Test Case 4.2: XSS Prevention
**Objective:** Verify XSS scripts are sanitized

```bash
# Submit paper with XSS in title
curl -X POST http://localhost:8080/api/submissions \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "<script>alert('XSS')</script>",
    "abstract": "Normal abstract"
  }'

# Expected: Script tags should be escaped or rejected
# Retrieve and verify:
curl -X GET http://localhost:8080/api/submissions/123 \
  -H "Authorization: Bearer <TOKEN>"

# Response should have escaped HTML:
# "title": "&lt;script&gt;alert('XSS')&lt;/script&gt;"
```

### Test Case 4.3: File Upload Validation
**Objective:** Verify only valid files are accepted

```bash
# Upload valid PDF
curl -X POST http://localhost:8080/api/submissions/123/upload \
  -H "Authorization: Bearer <TOKEN>" \
  -F "file=@paper.pdf"

# Expected: 200 OK

# Upload invalid file type
curl -X POST http://localhost:8080/api/submissions/123/upload \
  -H "Authorization: Bearer <TOKEN>" \
  -F "file=@malware.exe"

# Expected: 400 Bad Request

# Upload oversized file (>100MB)
curl -X POST http://localhost:8080/api/submissions/123/upload \
  -H "Authorization: Bearer <TOKEN>" \
  -F "file=@large_file.pdf"

# Expected: 413 Payload Too Large
```

---

## 🔑 5. Password Security Testing

### Test Case 5.1: Password Reset Flow
**Objective:** Verify complete password reset flow

```bash
# Step 1: Request password reset
curl -X POST http://localhost:8080/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'

# Expected: 200 OK (even if email doesn't exist - silent fail)
# Check email for OTP

# Step 2: Verify OTP
curl -X POST http://localhost:8080/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "otp": "123456"
  }'

# Expected: 200 OK with reset token

# Step 3: Reset password
curl -X POST http://localhost:8080/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<RESET_TOKEN>",
    "newPassword": "newSecurePass123"
  }'

# Expected: 200 OK

# Step 4: Login with new password
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "newSecurePass123"
  }'

# Expected: 200 OK with tokens
```

### Test Case 5.2: OTP Expiration
**Objective:** Verify OTP expires after configured time (5 minutes)

```bash
# Request OTP
curl -X POST http://localhost:8080/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# Wait 6 minutes

# Try to verify expired OTP
curl -X POST http://localhost:8080/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "otp": "123456"
  }'

# Expected: 400 Bad Request
# Error: "OTP expired"
```

### Test Case 5.3: Password Change
**Objective:** Verify users can change their password

```bash
# Change password with correct current password
curl -X PUT http://localhost:8080/api/user/change-password \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "oldPassword123",
    "newPassword": "newPassword456"
  }'

# Expected: 200 OK

# Try with wrong current password
curl -X PUT http://localhost:8080/api/user/change-password \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "wrongPassword",
    "newPassword": "newPassword456"
  }'

# Expected: 400 Bad Request
# Error: "Current password incorrect"
```

---

## 📊 6. Security Test Results Template

Use this template to document test results:

```markdown
## Security Test Run

**Date:** YYYY-MM-DD  
**Tester:** Name  
**Environment:** Development/Staging/Production  
**Backend Version:** X.X.X

### Test Summary

| Category | Total Tests | Passed | Failed | Skipped |
|----------|-------------|--------|--------|---------|
| Authentication | 4 | 4 | 0 | 0 |
| Authorization | 4 | 4 | 0 | 0 |
| CORS | 2 | 2 | 0 | 0 |
| Input Validation | 3 | 3 | 0 | 0 |
| Password Security | 3 | 3 | 0 | 0 |
| **TOTAL** | **16** | **16** | **0** | **0** |

### Failed Tests

*List any failed tests with details:*

#### Test 2.3: Chair Decision Making
- **Status:** ❌ FAILED
- **Expected:** 403 Forbidden for reviewer
- **Actual:** 200 OK (security breach!)
- **Impact:** High - Reviewers can make decisions
- **Action:** Fix @PreAuthorize annotation on DecisionController

### Security Issues Found

*List any security vulnerabilities discovered:*

1. **[HIGH] Missing authorization on endpoint X**
   - Endpoint: POST /api/endpoint
   - Issue: No @PreAuthorize annotation
   - Fix: Add `@PreAuthorize("hasAuthority('ROLE_ADMIN')")`
   
2. **[MEDIUM] CORS allows all origins**
   - Location: ControllerY
   - Issue: `@CrossOrigin(origins = "*")`
   - Fix: Remove annotation, use SecurityConfig

### Recommendations

1. Add rate limiting for login endpoint
2. Implement CAPTCHA for registration
3. Add audit logging for sensitive operations
4. Configure database backup automation

### Sign-off

- [x] All critical tests passed
- [x] No high-severity issues found
- [x] Security configuration reviewed
- [ ] Penetration testing completed (external)

**Approved by:** _______________  
**Date:** _______________
```

---

## 🔧 7. Automated Security Testing

### Using Python Script

Create `test_security.py`:

```python
import requests
import json

BASE_URL = "http://localhost:8080"

def test_auth_endpoints():
    """Test authentication endpoints"""
    
    # Test registration
    response = requests.post(f"{BASE_URL}/api/auth/register", json={
        "email": "test@example.com",
        "password": "testPass123",
        "fullName": "Test User"
    })
    assert response.status_code == 200, "Registration failed"
    
    # Test login
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "test@example.com",
        "password": "testPass123"
    })
    assert response.status_code == 200, "Login failed"
    token = response.json()["accessToken"]
    
    # Test protected endpoint without token
    response = requests.get(f"{BASE_URL}/api/user/profile")
    assert response.status_code == 401, "Should require authentication"
    
    # Test protected endpoint with token
    response = requests.get(
        f"{BASE_URL}/api/user/profile",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200, "Should allow authenticated user"
    
    print("✅ All authentication tests passed")

def test_authorization():
    """Test role-based access control"""
    
    # Login as regular user
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "user@example.com",
        "password": "password"
    })
    user_token = response.json()["accessToken"]
    
    # Try to create conference (admin only)
    response = requests.post(
        f"{BASE_URL}/api/conferences",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"name": "Test Conference"}
    )
    assert response.status_code == 403, "Should deny non-admin"
    
    print("✅ All authorization tests passed")

if __name__ == "__main__":
    test_auth_endpoints()
    test_authorization()
    print("\n✅ All security tests passed!")
```

Run tests:
```bash
python test_security.py
```

---

## 🚨 Security Incident Response

### If a Security Issue is Found

1. **DO NOT** disclose publicly immediately
2. Document the issue:
   - What endpoint/feature is affected?
   - What is the impact (data exposure, privilege escalation, etc.)?
   - How to reproduce?
   - Proof of concept (if safe)

3. Notify security team:
   - Email: security@uth.edu.vn
   - Include: Severity, Impact, Steps to reproduce

4. If critical:
   - Take affected service offline
   - Review access logs
   - Notify users if data breach

5. Fix and verify:
   - Apply fix
   - Re-run security tests
   - Deploy to production
   - Monitor logs

---

## 📚 Additional Resources

- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [Spring Security Testing](https://docs.spring.io/spring-security/reference/servlet/test/index.html)
- [JWT Security Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

---

**Version:** 1.0  
**Last Updated:** December 25, 2025  
**Next Review:** March 25, 2026
