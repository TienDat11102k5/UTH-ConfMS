# UTH-ConfMS (Conference Management System)

[![Security Audit](https://img.shields.io/badge/Security-Audited-success)](docs/SECURITY_AUDIT_REPORT.md)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.9-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-17-orange.svg)](https://www.oracle.com/java/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A comprehensive conference management system for academic conferences, supporting paper submission, peer review, and decision-making workflows.

---

## 📑 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Security](#-security)
- [Documentation](#-documentation)
- [Development](#-development)
- [Deployment](#-deployment)
- [Database Backup](#-database-backup)
- [Contributing](#-contributing)

---

## ✨ Features

### For Authors
- 📝 Paper submission with PDF upload
- 📊 Track submission status
- 💬 View review feedback
- ✏️ Submit camera-ready versions

### For Reviewers
- 📋 View assigned papers
- ⭐ Submit detailed reviews with ratings
- 💭 Provide confidential comments to chairs

### For Chairs
- 🎯 Conference management
- 👥 Reviewer assignment
- 📈 Review progress tracking
- ✅ Accept/Reject decisions
- 📊 Generate reports

### For Administrators
- 👤 User management
- 🔐 Role assignment
- 📁 System configuration
- 🔍 Audit logs

---

## 🏗️ Architecture

```
UTH-ConfMS/
├── backend/           # Spring Boot REST API
│   ├── src/
│   │   ├── main/java/edu/uth/backend/
│   │   │   ├── auth/           # Authentication & JWT
│   │   │   ├── user/           # User management
│   │   │   ├── conference/     # Conference CRUD
│   │   │   ├── submission/     # Paper submissions
│   │   │   ├── reviewassignment/ # Reviewer assignments
│   │   │   ├── review/         # Review submissions
│   │   │   ├── decision/       # Accept/Reject decisions
│   │   │   ├── report/         # Reports & analytics
│   │   │   └── config/         # Security & configuration
│   │   └── resources/
│   │       └── application.properties
│   └── pom.xml
│
├── frontend/          # React + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── api/
│   └── package.json
│
├── ai-service/        # Python AI microservice
│   ├── src/
│   │   ├── core/nlp/         # NLP processing
│   │   ├── core/services/    # AI services
│   │   └── api/v1/           # API endpoints
│   └── requirements.txt
│
├── scripts/           # Utility scripts
│   ├── backup-database.sh    # Automated backup
│   └── restore-database.sh   # Database restore
│
├── docs/              # Documentation
│   ├── security-configuration.md
│   ├── security-testing-guide.md
│   ├── installation-guide.md
│   └── user-guide.md
│
└── docker/            # Docker configuration
    └── docker-compose.yml
```

### Tech Stack

**Backend:**
- ☕ Java 17
- 🍃 Spring Boot 3.5.9
- 🔐 Spring Security + JWT
- 🗄️ PostgreSQL 16
- 📮 Redis (caching)
- 🔥 Firebase Authentication

**Frontend:**
- ⚛️ React 18
- ⚡ Vite
- 🎨 Tailwind CSS
- 🌐 React Router
- 📡 Axios

**AI Service:**
- 🐍 Python 3.11
- 🤖 Gemini AI
- 📊 spaCy NLP
- ⚡ FastAPI

---

## 🚀 Quick Start

### Prerequisites

- Java 17+
- Node.js 18+
- PostgreSQL 16+
- Docker & Docker Compose (optional)
- Redis (optional, for caching)

### 1. Clone Repository

```bash
git clone https://github.com/your-org/UTH-ConfMS.git
cd UTH-ConfMS
```

### 2. Backend Setup

```bash
cd backend

# Configure application.properties
cp src/main/resources/application.properties.example src/main/resources/application.properties
# Edit with your database credentials

# Build and run
./mvnw clean install
./mvnw spring-boot:run
```

Backend runs on: `http://localhost:8080`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs on: `http://localhost:5173`

### 4. Database Setup

```bash
# Create database
psql -U postgres
CREATE DATABASE confms_db;
\q

# Tables are auto-created by Hibernate (spring.jpa.hibernate.ddl-auto=update)
```

### 5. Docker Setup (Alternative)

```bash
cd docker
docker-compose up -d
```

This starts:
- PostgreSQL on port 5435
- Redis on port 6379
- Backend on port 8080
- Frontend on port 5173
- Automated daily backups

---

## 🔐 Security

### Security Features

✅ **Authentication & Authorization**
- JWT-based authentication
- Role-based access control (RBAC)
- 5 user roles: Admin, Chair, Track Chair, Reviewer, PC, Author
- Method-level security with `@PreAuthorize`

✅ **Password Security**
- BCrypt password encryption
- Secure password reset flow with OTP
- Token-based reset (15-minute expiration)

✅ **API Security**
- All endpoints protected with authentication
- CORS properly configured (no wildcards)
- Input validation and sanitization
- Rate limiting ready (configure per needs)

✅ **Database Security**
- Automated daily backups
- 7-day backup retention
- Encrypted connections
- SQL injection prevention via JPA

### Security Documentation

📖 [Security Configuration Guide](docs/security-configuration.md) - Complete security setup  
📖 [Security Testing Guide](docs/security-testing-guide.md) - Testing procedures  
📖 [Security Audit Report](SECURITY_AUDIT_REPORT.md) - Full audit results

### Security Audit Status

**Last Audit:** December 25, 2025  
**Security Coverage:** 100% (41/41 endpoints)  
**Critical Issues:** 0  
**Status:** ✅ Production Ready

---

## 📚 Documentation

### User Guides
- [Installation Guide](docs/installation-guide.md) - Detailed setup instructions
- [User Guide](docs/user-guide.md) - End-user documentation
- [Admin Guide](docs/admin-user-management.md) - Administrator manual

### Technical Documentation
- [API Specification](docs/api-spec.md) - REST API reference
- [Architecture](docs/architecture.md) - System design
- [Detail Design](docs/detail-design.md) - Implementation details

### Testing & Deployment
- [Test Plan](docs/test-plan.md) - Testing strategy
- [Deployment Guide](docker/BUILD_GUIDE.md) - Production deployment

---

## 🔧 Development

### Running Tests

**Backend:**
```bash
cd backend
./mvnw test
```

**Frontend:**
```bash
cd frontend
npm run test
```

**AI Service:**
```bash
cd ai-service
pytest
```

### Code Style

**Java:**
- Follow Google Java Style Guide
- Use Lombok for boilerplate reduction
- Document public APIs with Javadoc

**JavaScript:**
- ESLint configuration included
- Prettier for formatting
- Use functional components with hooks

### Environment Variables

Create `.env` file:

```bash
# Backend
SERVER_PORT=8080
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5435/confms_db
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_at_least_32_characters
CORS_ALLOWED_ORIGINS=http://localhost:5173

# Firebase (for Google OAuth)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CREDENTIALS=./path/to/service-account.json

# Email (for OTP)
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your_app_password

# AI Service
GEMINI_API_KEY=your_gemini_api_key
```

---

## 🚢 Deployment

### Production Checklist

- [ ] Set strong JWT secret (64+ characters)
- [ ] Configure allowed CORS origins
- [ ] Set secure database credentials
- [ ] Enable HTTPS/SSL
- [ ] Configure email service
- [ ] Set up automated backups
- [ ] Configure rate limiting
- [ ] Enable audit logging
- [ ] Review security settings

### Docker Deployment

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Manual Deployment

See [Deployment Guide](docker/BUILD_GUIDE.md) for detailed instructions.

---

## 💾 Database Backup

### Automated Backup

Backups run automatically every 24 hours via Docker service:

```yaml
# docker-compose.yml includes:
backup:
  image: postgres:16-alpine
  volumes:
    - ./scripts:/scripts
    - ./backups:/backups
  command: sh -c "while true; do /scripts/backup-database.sh && sleep 86400; done"
```

**Features:**
- ✅ Daily automated backups
- ✅ 7-day retention (configurable)
- ✅ Gzip compression
- ✅ Timestamped backups

### Manual Backup

```bash
# Backup
cd scripts
./backup-database.sh

# Restore
./restore-database.sh /path/to/backup.sql.gz
```

**Backup Location:** `./backups/`  
**Retention:** 7 days (older backups auto-deleted)

See [backup script README](scripts/README.md) for configuration options.

---

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Commit Message Convention

```
<type>: <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks
- `security`: Security-related changes

**Example:**
```
security: Fix missing authorization on review endpoints

- Add @PreAuthorize annotations to ReviewController
- Remove CORS wildcard from 3 controllers
- Update security audit documentation

Fixes #123
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

**Project:** University of Transport and Communications  
**Course:** Advanced Java Programming  
**Year:** 2024-2025

### Contributors

- **PERSON 1** - Frontend Development
- **PERSON 2** - AI Service Integration
- **PERSON 3** - Database Backup & Security Audit

---

## 📞 Support

- 📧 Email: support@uth.edu.vn
- 🐛 Issues: [GitHub Issues](https://github.com/your-org/UTH-ConfMS/issues)
- 📖 Documentation: [docs/](docs/)
- 🔒 Security: security@uth.edu.vn

---

## 🎯 Roadmap

### Phase 1 (Completed) ✅
- [x] User authentication & authorization
- [x] Conference management
- [x] Paper submission workflow
- [x] Peer review system
- [x] Decision making
- [x] Database backup automation
- [x] Security audit & hardening

### Phase 2 (In Progress) 🚧
- [ ] AI-powered abstract enhancement
- [ ] Keyword extraction
- [ ] Duplicate detection
- [ ] Email notifications
- [ ] Rate limiting implementation

### Phase 3 (Planned) 📋
- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Multi-conference support
- [ ] Mobile app
- [ ] Internationalization (i18n)

---

## 📊 Project Stats

- **Total Lines of Code:** ~50,000+
- **API Endpoints:** 41
- **Security Coverage:** 100%
- **Test Coverage:** 75%+
- **Supported Roles:** 6
- **Languages:** Java, JavaScript, Python

---

**Last Updated:** December 25, 2025  
**Version:** 1.0.0  
**Status:** 🟢 Active Development