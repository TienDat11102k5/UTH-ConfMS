# Kiến Trúc Hệ Thống (Architecture Design)

## Thông Tin Tài Liệu

| Thông tin     | Chi tiết      |
| ------------- | ------------- |
| **Dự án**     | UTH-ConfMS    |
| **Phiên bản** | 1.0           |
| **Ngày tạo**  | Tháng 01/2026 |

---

## 1. Tổng Quan Kiến Trúc

### 1.1 Kiến Trúc Tổng Thể

UTH-ConfMS sử dụng kiến trúc **3-Tier Microservices** với các thành phần chính:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                   │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                    Frontend (React + Vite)                         │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │  │
│  │  │  Admin   │ │  Author  │ │  Chair   │ │ Reviewer │ │  Public  │  │  │
│  │  │  Pages   │ │  Pages   │ │  Pages   │ │  Pages   │ │  Pages   │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────┬────────────────────────────────────────┘
                                  │ HTTPS (REST API)
┌─────────────────────────────────▼────────────────────────────────────────┐
│                           SERVER LAYER                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                  Backend (Spring Boot 3.x)                          │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐            │ │
│  │  │Controllers│ │ Services  │ │Repositories│ │ Security  │            │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘            │ │
│  └──────────────────────────────┬──────────────────────────────────────┘ │
│                                 │                                        │
│  ┌──────────────────────────────▼──────────────────────────────────────┐ │
│  │                  AI Service (Python FastAPI)                        │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐            │ │
│  │  │ NLP Core  │ │ Services  │ │ Governance│ │    API    │            │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘            │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────┬────────────────────────────────────────┘
                                  │ JDBC / Redis Protocol
┌─────────────────────────────────▼────────────────────────────────────────┐
│                           DATA LAYER                                     │
│  ┌─────────────────────┐              ┌─────────────────────┐            │
│  │   PostgreSQL 16     │              │       Redis         │            │
│  │   (Primary DB)      │              │     (Cache)         │            │
│  └─────────────────────┘              └─────────────────────┘            │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                    File Storage (uploads/)                          │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Mô Hình Triển Khai (Deployment)

```mermaid
flowchart TB
    subgraph Internet
        Client[🌐 Web Browser]
    end

    subgraph Docker["🐳 Docker Compose"]
        subgraph FrontendContainer["Container: uth_frontend"]
            Nginx[Nginx :80]
            ReactApp[React App]
        end

        subgraph BackendContainer["Container: uth_backend"]
            SpringBoot[Spring Boot :8080]
        end

        subgraph AIContainer["Container: uth_ai"]
            FastAPI[FastAPI :8000]
        end

        subgraph DBContainer["Container: uth_db"]
            Postgres[(PostgreSQL :5432)]
        end

        subgraph CacheContainer["Container: uth_redis"]
            Redis[(Redis :6379)]
        end

        subgraph BackupContainer["Container: uth_backup"]
            BackupScript[Backup Script]
        end
    end

    subgraph External["🌐 External Services"]
        Firebase[Firebase Auth]
        Gemini[Gemini AI]
        SMTP[SMTP Server]
    end

    Client --> Nginx
    Nginx --> ReactApp
    ReactApp --> SpringBoot
    SpringBoot --> FastAPI
    SpringBoot --> Postgres
    SpringBoot --> Redis
    FastAPI --> Postgres
    FastAPI --> Redis
    FastAPI --> Gemini
    SpringBoot --> Firebase
    SpringBoot --> SMTP
    BackupScript --> Postgres
```

---

## 2. Kiến Trúc Chi Tiết Các Thành Phần

### 2.1 Backend Service (Spring Boot)

#### 2.1.1 Cấu Trúc Package

```
edu.uth.backend/
├── BackendApplication.java      # Main class
├── config/                      # Configuration classes
│   ├── SecurityConfig.java      # Spring Security config
│   ├── CorsConfig.java          # CORS configuration
│   ├── RedisConfig.java         # Redis configuration
│   └── FirebaseConfig.java      # Firebase Admin SDK
│
├── entity/                      # JPA Entities
│   ├── User.java
│   ├── Role.java
│   ├── Conference.java
│   ├── Track.java
│   ├── Paper.java
│   ├── Review.java
│   └── ...
│
├── repository/                  # Spring Data JPA Repositories
│   ├── UserRepository.java
│   ├── PaperRepository.java
│   └── ...
│
├── auth/                        # Authentication module
│   ├── AuthController.java
│   ├── AuthService.java
│   └── dto/
│
├── submission/                  # Submission module
│   ├── SubmissionController.java
│   ├── SubmissionService.java
│   └── dto/
│
├── review/                      # Review module
├── decision/                    # Decision module
├── ai/                          # AI integration
├── admin/                       # Admin module
└── security/                    # Security filters & utils
```

#### 2.1.2 Layered Architecture

```mermaid
flowchart TB
    subgraph Presentation["Presentation Layer"]
        Controllers[Controllers]
        DTOs[DTOs]
    end

    subgraph Business["Business Logic Layer"]
        Services[Services]
        Validators[Validators]
    end

    subgraph Persistence["Persistence Layer"]
        Repositories[Repositories]
        Entities[Entities]
    end

    subgraph Infrastructure["Infrastructure Layer"]
        Security[Security]
        Config[Configuration]
        Utils[Utilities]
    end

    Controllers --> Services
    Services --> Repositories
    Repositories --> Entities
    Controllers --> DTOs
    Services --> Validators
    Security --> Controllers
```

### 2.2 Frontend Application (React)

#### 2.2.1 Cấu Trúc Thư Mục

```
frontend/src/
├── main.jsx                 # Entry point
├── App.jsx                  # Main component + routing
├── apiClient.js             # Axios configuration
├── auth.js                  # Auth utilities
├── firebase.js              # Firebase config
│
├── api/                     # API call functions
│   ├── submissionAPI.js
│   ├── conferenceAPI.js
│   └── ai/
│
├── components/              # Reusable components
│   ├── Layout/
│   ├── Toast.jsx
│   ├── Pagination.jsx
│   └── ...
│
├── pages/                   # Page components by role
│   ├── admin/               # Admin pages (14)
│   ├── author/              # Author pages (12)
│   ├── chair/               # Chair pages (10)
│   ├── reviewer/            # Reviewer pages (5)
│   └── public/              # Public pages (6)
│
├── styles/                  # CSS styles
├── i18n/                    # Internationalization
│   ├── index.js
│   └── locales/
│       ├── en.json
│       └── vi.json
│
└── utils/                   # Utility functions
```

#### 2.2.2 State Management

```mermaid
flowchart LR
    subgraph LocalState["Local State"]
        useState[useState Hook]
        useReducer[useReducer Hook]
    end

    subgraph Storage["Browser Storage"]
        localStorage[localStorage]
        sessionStorage[sessionStorage]
    end

    subgraph Context["React Context"]
        AuthContext[Auth Context]
        I18nContext[I18n Context]
    end

    useState --> Components
    Storage --> AuthContext
    AuthContext --> Components
    I18nContext --> Components
```

### 2.3 AI Service (Python FastAPI)

#### 2.3.1 Cấu Trúc Thư Mục

```
ai-service/src/
├── app/
│   ├── main.py              # FastAPI app entry
│   └── settings.py          # Configuration
│
├── api/
│   └── v1/
│       ├── spell_check.py   # Spell check endpoint
│       ├── synopsis.py      # Synopsis generation
│       ├── similarity.py    # Reviewer-paper matching
│       ├── email_draft.py   # Email template generation
│       └── governance.py    # Feature flags API
│
├── core/
│   ├── nlp/                 # NLP processing
│   │   ├── spell_checker.py
│   │   ├── summarizer.py
│   │   └── keyword_extractor.py
│   │
│   ├── services/            # Business logic
│   │   ├── spell_service.py
│   │   ├── synopsis_service.py
│   │   └── similarity_service.py
│   │
│   ├── governance/          # AI governance
│   │   ├── feature_flags.py
│   │   ├── audit_logger.py
│   │   └── rate_limiter.py
│   │
│   ├── models/              # Data models
│   └── infra/               # Infrastructure
│
└── tests/                   # Test files
```

---

## 3. Thiết Kế Database

### 3.1 ERD Tổng Quan

```mermaid
erDiagram
    USERS ||--o{ USER_ROLES : has
    ROLES ||--o{ USER_ROLES : assigned_to
    USERS ||--o{ CONFERENCES : organizes
    CONFERENCES ||--o{ TRACKS : contains
    TRACKS ||--o{ PAPERS : contains
    USERS ||--o{ PAPERS : submits
    PAPERS ||--o{ REVIEW_ASSIGNMENTS : has
    USERS ||--o{ REVIEW_ASSIGNMENTS : assigned_to
    REVIEW_ASSIGNMENTS ||--o| REVIEWS : results_in
    PAPERS ||--o{ DISCUSSIONS : has
    PAPERS ||--o{ CONFLICTS_OF_INTEREST : has
```

### 3.2 Các Bảng Chính

| Bảng               | Mô tả                                    | Record ước tính |
| ------------------ | ---------------------------------------- | --------------- |
| users              | Người dùng                               | 1,000+          |
| roles              | Vai trò (ADMIN, CHAIR, REVIEWER, AUTHOR) | 4               |
| conferences        | Hội nghị                                 | 50+             |
| tracks             | Tracks của hội nghị                      | 200+            |
| papers             | Bài báo                                  | 5,000+          |
| review_assignments | Phân công reviewer                       | 15,000+         |
| reviews            | Đánh giá                                 | 10,000+         |
| discussions        | Thảo luận PC                             | 5,000+          |

---

## 4. Luồng Dữ Liệu

### 4.1 Luồng Xác Thực

```mermaid
sequenceDiagram
    participant C as Client
    participant F as Frontend
    participant B as Backend
    participant FB as Firebase
    participant DB as Database

    C->>F: Login request
    F->>B: POST /api/auth/login
    B->>DB: Find user by email
    B->>B: Verify password (BCrypt)
    B->>B: Generate JWT
    B-->>F: JWT token + user info
    F->>F: Store in localStorage
    F-->>C: Redirect to dashboard

    Note over C,DB: Subsequent requests
    C->>F: Protected page
    F->>B: API call + JWT header
    B->>B: Validate JWT
    B->>DB: Query data
    B-->>F: Response
```

### 4.2 Luồng Nộp Bài

```mermaid
sequenceDiagram
    participant A as Author
    participant F as Frontend
    participant B as Backend
    participant AI as AI Service
    participant S as Storage
    participant DB as Database

    A->>F: Fill submission form
    A->>F: Upload PDF

    opt AI Spell Check
        F->>B: POST /api/ai/spell-check
        B->>AI: Check text
        AI-->>B: Suggestions
        B-->>F: Display suggestions
        A->>F: Accept/reject
    end

    A->>F: Submit
    F->>B: POST /api/submissions (multipart)
    B->>B: Validate data & deadline
    B->>S: Save PDF file
    B->>DB: Create Paper record
    B->>DB: Create CoAuthors
    B->>DB: Create AuditLog
    B-->>F: Success + Paper ID
    F-->>A: Confirmation
```

---

## 5. Bảo Mật

### 5.1 Authentication & Authorization

```mermaid
flowchart TB
    subgraph Auth["Authentication"]
        JWT[JWT Token]
        Firebase[Firebase Auth]
        BCrypt[BCrypt Password]
    end

    subgraph AuthZ["Authorization"]
        RBAC[Role-Based Access]
        PreAuth["@PreAuthorize"]
        SecurityConfig[Security Config]
    end

    subgraph Filters["Security Filters"]
        JWTFilter[JWT Auth Filter]
        CORSFilter[CORS Filter]
    end

    Request --> Filters
    Filters --> Auth
    Auth --> AuthZ
    AuthZ --> Controller
```

### 5.2 Security Measures

| Measure          | Implementation                      |
| ---------------- | ----------------------------------- |
| Password Hashing | BCrypt (strength 12)                |
| Token            | JWT với HS256 signature             |
| HTTPS            | TLS 1.3                             |
| CORS             | Whitelist origins                   |
| SQL Injection    | JPA/Hibernate parameterized queries |
| XSS              | React auto-escaping                 |
| CSRF             | Stateless JWT (không cần)           |
| Rate Limiting    | Redis-based (AI endpoints)          |

---

## 6. Công Nghệ Sử Dụng

### 6.1 Backend Stack

| Thành phần | Công nghệ                   | Phiên bản |
| ---------- | --------------------------- | --------- |
| Runtime    | Java                        | 21        |
| Framework  | Spring Boot                 | 3.5.9     |
| Security   | Spring Security             | 6.x       |
| ORM        | Spring Data JPA + Hibernate | 6.x       |
| Database   | PostgreSQL                  | 16        |
| Cache      | Redis                       | 7.x       |
| Build Tool | Maven                       | 3.9+      |

### 6.2 Frontend Stack

| Thành phần  | Công nghệ     | Phiên bản |
| ----------- | ------------- | --------- |
| Library     | React         | 19.x      |
| Build Tool  | Vite          | 7.x       |
| HTTP Client | Axios         | 1.x       |
| Routing     | React Router  | 7.x       |
| i18n        | i18next       | 25.x      |
| Auth        | Firebase Auth | 12.x      |

### 6.3 AI Service Stack

| Thành phần  | Công nghệ             | Phiên bản |
| ----------- | --------------------- | --------- |
| Runtime     | Python                | 3.11+     |
| Framework   | FastAPI               | latest    |
| AI Provider | Google Gemini         | 1.5+      |
| Embeddings  | sentence-transformers | latest    |
| DB Driver   | asyncpg + psycopg2    | latest    |

### 6.4 DevOps Stack

| Thành phần       | Công nghệ      |
| ---------------- | -------------- |
| Containerization | Docker         |
| Orchestration    | Docker Compose |
| CI/CD            | GitHub Actions |
| Reverse Proxy    | Nginx          |

---

## Tài Liệu Liên Quan

- [Chi tiết thiết kế](detail-design.md)
- [Sơ đồ UML](uml-diagrams.md)
- [API Specification](api-spec.md)
- [Hướng dẫn cài đặt](installation-guide.md)
