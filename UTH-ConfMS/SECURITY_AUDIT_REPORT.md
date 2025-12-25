# Security Audit Report - Phase 1

**Project:** UTH-ConfMS (Conference Management System)  
**Date:** December 23, 2025  
**Auditor:** PERSON 3 - Database Backup & Security Team  
**Scope:** Backend API Security - All Controllers

---

## 📋 Executive Summary

This security audit reviews all API endpoints in the UTH-ConfMS backend to ensure proper authentication and authorization controls are in place.

**Status:** 🔄 In Progress

---

## 🎯 Audit Objectives

1. Verify all endpoints have proper security annotations
2. Ensure role-based access control (RBAC) is correctly implemented
3. Identify and fix security vulnerabilities
4. Document security configuration for each controller

---

## 🔍 Methodology

- Review all `@RestController` classes
- Check for `@PreAuthorize` and security annotations
- Verify access control matches business requirements
- Test endpoints with different user roles

---

## 📊 Controllers Audit

### 1. AuthController ✅

**File:** `backend/src/main/java/edu/uth/backend/auth/AuthController.java`  
**Base Path:** `/api/auth`

| Endpoint | Method | Current Security | Required Security | Status |
|----------|--------|------------------|-------------------|--------|
| `/register` | POST | Public (permitAll) | ✅ Correct - Public registration | ✅ OK |
| `/login` | POST | Public (permitAll) | ✅ Correct - Public login | ✅ OK |
| `/firebase/google` | POST | Public (permitAll) | ✅ Correct - Public OAuth | ✅ OK |
| `/google` | POST | Public (permitAll) | ✅ Correct - Public OAuth alias | ✅ OK |
| `/forgot-password` | POST | Public (permitAll) | ✅ Correct - Public password reset | ✅ OK |
| `/verify-otp` | POST | Public (permitAll) | ✅ Correct - Public OTP verification | ✅ OK |
| `/reset-password` | POST | Public (permitAll) | ✅ Correct - Public password reset | ✅ OK |

**Security Features:**
- ✅ All endpoints are public (authentication endpoints)
- ✅ Input validation with `@Valid` annotations
- ✅ Password reset flow with OTP verification
- ✅ Rate limiting mentioned (should be implemented at gateway level)
- ✅ Silent fail on forgot-password (security best practice)

**Recommendations:**
- ⚠️ Implement rate limiting for `/login`, `/register`, `/forgot-password` to prevent brute force
- ⚠️ Consider adding CAPTCHA for registration
- ✅ OTP verification with max 5 attempts is good

**Overall Status:** ✅ **SECURE** - No changes needed

---

### 2. UserController ⚠️

**File:** `backend/src/main/java/edu/uth/backend/user/UserController.java`  
**Base Path:** `/api/user`

| Endpoint | Method | Current Security | Required Security | Status |
|----------|--------|------------------|-------------------|--------|
| `/profile` | GET | ❌ No annotation | Authenticated users only | ❌ NEEDS FIX |
| `/profile` | PUT | ❌ No annotation | Authenticated users only | ❌ NEEDS FIX |
| `/upload-avatar` | POST | ❌ No annotation | Authenticated users only | ❌ NEEDS FIX |
| `/change-password` | PUT | ❌ No annotation | Authenticated users only | ❌ NEEDS FIX |

**Current Implementation:**
- ⚠️ Manual authentication check: `if (auth == null)` in each method
- ⚠️ No `@PreAuthorize` annotations
- ✅ Good: User can only access/modify their own profile
- ✅ Good: Avatar file validation (size, type)
- ✅ Good: Password change requires current password verification

**Security Issues:**
- ❌ **Missing @PreAuthorize annotations** - relying on manual checks only
- ❌ No explicit security configuration at controller level
- ⚠️ Inconsistent error responses (some use String, some use Map)

**Required Changes:**
```java
// Add to class level or each method:
@PreAuthorize("isAuthenticated()")
```

**Recommendations:**
- ✅ Add `@PreAuthorize("isAuthenticated()")` to all endpoints
- ✅ Remove manual `if (auth == null)` checks (redundant after adding annotation)
- ✅ Standardize error response format
- ✅ Consider rate limiting for upload-avatar

**Overall Status:** ⚠️ **NEEDS SECURITY FIX**

---

