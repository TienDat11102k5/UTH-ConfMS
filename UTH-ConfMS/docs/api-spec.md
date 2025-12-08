# API Specification

## 1. Authentication APIs
### POST /api/auth/register
### POST /api/auth/login
### POST /api/auth/logout
### POST /api/auth/refresh-token

## 2. User Management APIs
### GET /api/users
### GET /api/users/{id}
### PUT /api/users/{id}
### DELETE /api/users/{id}

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
