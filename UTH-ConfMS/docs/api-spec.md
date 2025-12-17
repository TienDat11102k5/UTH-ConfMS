# API Specification

## 1. Authentication APIs
### POST /api/auth/register
### POST /api/auth/login
### POST /api/auth/logout
### POST /api/auth/refresh-token

## 2. User Management APIs

### User (self-service)
- GET /api/user/profile
- PUT /api/user/profile
- POST /api/user/upload-avatar

### Admin user management
- GET /api/admin/users
- PUT /api/admin/users/{id}/role
- PUT /api/admin/users/{id}/status
- PUT /api/admin/users/{id}/name
- DELETE /api/admin/users/{id}

## 3. Conference APIs
### GET /api/conferences
### POST /api/conferences
### GET /api/conferences/{id}
### PUT /api/conferences/{id}
### DELETE /api/conferences/{id}

## 4. Submission APIs
### POST /api/submissions
### GET /api/submissions/{id}
### PUT /api/submissions/{id}
### DELETE /api/submissions/{id}

## 5. Review APIs
### GET /api/reviews
### POST /api/reviews
### PUT /api/reviews/{id}

## 6. AI Service APIs
### POST /api/ai/analyze-similarity
### POST /api/ai/suggest-reviewers
### POST /api/ai/detect-plagiarism
