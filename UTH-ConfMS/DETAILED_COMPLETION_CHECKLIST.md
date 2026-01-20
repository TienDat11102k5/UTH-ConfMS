# UTH-ConfMS Detailed Completion Checklist

## 📋 Hướng dẫn sử dụng
- ✅ = Đã hoàn thành
- ⚠️ = Đang làm / Cần kiểm tra
- ❌ = Chưa làm
- 🔥 = Ưu tiên cao (CRITICAL)
- ⭐ = Ưu tiên trung bình
- 💡 = Ưu tiên thấp (Nice to have)

---

## PHASE 1: CRITICAL FIXES (Tuần 1) 🔥

### 1.1. Security Fixes 🔥
- [ ] **Remove permitAll from SecurityConfig**
  - File: `backend/src/main/java/edu/uth/backend/config/SecurityConfig.java`
  - Xóa dòng: `.requestMatchers("/api/decisions/**", "/api/assignments/**", "/api/reviews/**", "/api/submissions/**").permitAll()`
  - Test: Đảm bảo tất cả APIs yêu cầu authentication
  - Estimated time: 30 minutes

- [ ] **Add @PreAuthorize to all endpoints**
  - Files to check:
    - `ReviewAssignmentController.java` ✅ (Done)
    - `ReviewController.java` ✅ (Done)
    - `DecisionController.java` ✅ (Done)
    - `SubmissionController.java` ❌ (Need to add)
    - `CameraReadyController.java` ❌ (Need to add)
    - `ConferenceController.java` ⚠️ (Check if needed)
    - `UserController.java` ❌ (Need to add)
  - Estimated time: 2 hours

- [ ] **Test authentication for all roles**
  - Test Author can only access own submissions
  - Test Reviewer can only access assigned papers
  - Test Chair can access all papers in conference
  - Test Admin can access everything
  - Estimated time: 2 hours

### 1.2. Email Notifications 🔥
- [ ] **Setup SMTP Configuration**
  - File: `backend/src/main/resources/application.properties`
  - Add:
    ```properties
    spring.mail.host=smtp.gmail.com
    spring.mail.port=587
    spring.mail.username=${SMTP_USERNAME}
    spring.mail.password=${SMTP_PASSWORD}
    spring.mail.properties.mail.smtp.auth=true
    spring.mail.properties.mail.smtp.starttls.enable=true
    ```
  - Estimated time: 30 minutes

- [ ] **Create EmailService**
  - File: `backend/src/main/java/edu/uth/backend/email/EmailService.java`
  - Methods:
    - `sendAssignmentNotification(ReviewAssignment assignment)`
    - `sendReviewSubmittedNotification(Review review)`
    - `sendDecisionNotification(Paper paper, String decision)`
    - `sendCameraReadyReminderNotification(Paper paper)`
  - Estimated time: 3 hours

- [ ] **Create Email Templates**
  - Files: `backend/src/main/resources/templates/email/`
    - `assignment-notification.html`
    - `review-submitted.html`
    - `decision-accept.html`
    - `decision-reject.html`
    - `camera-ready-reminder.html`
  - Use Thymeleaf or plain HTML
  - Estimated time: 2 hours

- [ ] **Integrate Email into Services**
  - `ReviewAssignmentService.assignReviewer()` → Send email to reviewer
  - `ReviewService.submitReview()` → Send email to chair
  - `DecisionService.makeDecision()` → Send email to author
  - `CameraReadyService` → Send reminder emails
  - Estimated time: 2 hours

- [ ] **Test Email Sending**
  - Test with real SMTP (Gmail, SendGrid, etc.)
  - Test all email templates
  - Test error handling (SMTP down, invalid email)
  - Estimated time: 2 hours

### 1.3. Error Logging 🔥
- [ ] **Add Logging Framework**
  - Already have SLF4J with Spring Boot
  - Configure log levels in `application.properties`:
    ```properties
    logging.level.root=INFO
    logging.level.edu.uth.backend=DEBUG
    logging.file.name=logs/uth-confms.log
    logging.pattern.console=%d{yyyy-MM-dd HH:mm:ss} - %msg%n
    ```
  - Estimated time: 30 minutes

- [ ] **Add Logging to Controllers**
  - Add `@Slf4j` annotation (Lombok)
  - Log all requests: `log.info("Request: {} {}", method, path)`
  - Log all errors: `log.error("Error: ", exception)`
  - Files to update: All controllers
  - Estimated time: 2 hours

- [ ] **Add Exception Handler**
  - File: `backend/src/main/java/edu/uth/backend/exception/GlobalExceptionHandler.java`
  - Handle:
    - `RuntimeException`
    - `AccessDeniedException`
    - `MethodArgumentNotValidException`
    - `HttpMessageNotReadableException`
  - Return proper error responses
  - Estimated time: 2 hours

### 1.4. Database Backup 🔥
- [ ] **Create Backup Script**
  - File: `scripts/backup-database.sh`
  - Use `pg_dump` to backup PostgreSQL
  - Schedule with cron (daily at 2 AM)
  - Estimated time: 1 hour

- [ ] **Create Restore Script**
  - File: `scripts/restore-database.sh`
  - Use `pg_restore` to restore from backup
  - Test restore process
  - Estimated time: 1 hour

- [ ] **Setup Backup Storage**
  - Store backups in `/backups` volume
  - Keep last 7 days of backups
  - Optional: Upload to S3/Google Cloud Storage
  - Estimated time: 2 hours

---

## PHASE 2: TESTING (Tuần 2) ⭐

### 2.1. Unit Tests
- [ ] **Setup Test Framework**
  - Already have JUnit 5 and Mockito
  - Add test dependencies if needed
  - Estimated time: 30 minutes

- [x] **Service Layer Tests**
  - [x] `SubmissionServiceTest.java`
    - Test submitPaper()
    - Test updatePaper()
    - Test withdrawPaper()
    - Test getPapersByAuthor()
  - [x] `ReviewAssignmentServiceTest.java`
    - Test assignReviewer()
    - Test COI checks
    - Test getMyAssignments()
  - [x] `ReviewServiceTest.java`
    - Test submitReview()
    - Test score validation
    - Test getReviewsByPaper()
  - [x] `DecisionServiceTest.java`
    - Test makeDecision()
    - Test bulkMakeDecision()
    - Test getReviewStatistics()
  - [x] `AdminServiceTest.java`
  - Estimated time: 8 hours

- [ ] **Repository Tests**
  - [ ] `PaperRepositoryTest.java`
  - [ ] `ReviewAssignmentRepositoryTest.java`
  - [ ] `ReviewRepositoryTest.java`
  - Use `@DataJpaTest`
  - Test custom queries
  - Estimated time: 4 hours

- [ ] **Controller Tests**
  - [ ] `SubmissionControllerTest.java`
  - [ ] `ReviewAssignmentControllerTest.java`
  - [ ] `ReviewControllerTest.java`
  - [ ] `DecisionControllerTest.java`
  - Use `@WebMvcTest`
  - Mock services
  - Test HTTP responses
  - Estimated time: 8 hours

- [ ] **Frontend Tests**
  - [ ] Setup Vitest or Jest
  - [ ] Test critical components:
    - `AuthorSubmissionListPage.test.jsx`
    - `ReviewerAssignments.test.jsx`
    - `ChairAssignmentManagement.test.jsx`
  - Estimated time: 6 hours

### 2.2. Integration Tests
- [ ] **End-to-End Workflow Tests**
  - [ ] Test complete submission workflow
  - [ ] Test complete review workflow
  - [ ] Test complete decision workflow
  - Use `@SpringBootTest`
  - Use TestRestTemplate
  - Estimated time: 6 hours

- [ ] **API Integration Tests**
  - [ ] Test all REST endpoints
  - [ ] Test authentication
  - [ ] Test authorization
  - [ ] Test error responses
  - Estimated time: 4 hours

### 2.3. Load Testing
- [ ] **Setup Load Testing Tool**
  - Use JMeter or Gatling
  - Create test scenarios
  - Estimated time: 2 hours

- [ ] **Run Load Tests**
  - Test 100 concurrent users
  - Test 1000 papers submission
  - Test deadline peak (500 submissions in 1 hour)
  - Measure response times
  - Identify bottlenecks
  - Estimated time: 4 hours

- [ ] **Optimize Performance**
  - Add database indexes
  - Add caching (Redis)
  - Optimize queries
  - Estimated time: 8 hours

---

## PHASE 3: DOCUMENTATION (Tuần 2-3) ⭐

### 3.1. Software Requirements Specification (SRS)
- [ ] **1. Introduction**
  - Purpose
  - Scope
  - Definitions, Acronyms, Abbreviations
  - References
  - Overview
  - Estimated time: 2 hours

- [ ] **2. Overall Description**
  - Product Perspective
  - Product Functions
  - User Characteristics
  - Constraints
  - Assumptions and Dependencies
  - Estimated time: 3 hours

- [ ] **3. Specific Requirements**
  - [ ] 3.1. Functional Requirements
    - Author features (detailed)
    - Reviewer features (detailed)
    - Chair features (detailed)
    - Admin features (detailed)
  - [ ] 3.2. Non-Functional Requirements
    - Performance
    - Security
    - Usability
    - Reliability
  - [ ] 3.3. Interface Requirements
    - User interfaces
    - Hardware interfaces
    - Software interfaces
    - Communication interfaces
  - Estimated time: 6 hours

- [ ] **4. System Features**
  - For each feature:
    - Description
    - Stimulus/Response Sequences
    - Functional Requirements
  - Estimated time: 4 hours

### 3.2. UML Diagrams
- [ ] **Use Case Diagrams**
  - [ ] Author use cases
  - [ ] Reviewer use cases
  - [ ] Chair use cases
  - [ ] Admin use cases
  - Tool: PlantUML, Draw.io, or Lucidchart
  - Estimated time: 3 hours

- [ ] **Class Diagrams**
  - [ ] Entity classes
  - [ ] Service classes
  - [ ] Controller classes
  - Show relationships and multiplicity
  - Estimated time: 4 hours

- [ ] **Sequence Diagrams**
  - [ ] Submit paper sequence
  - [ ] Assign reviewer sequence
  - [ ] Submit review sequence
  - [ ] Make decision sequence
  - Estimated time: 4 hours

- [ ] **Activity Diagrams**
  - [ ] Submission workflow
  - [ ] Review workflow
  - [ ] Decision workflow
  - Estimated time: 3 hours

- [ ] **State Diagrams**
  - [ ] Paper status transitions
  - [ ] Assignment status transitions
  - Estimated time: 2 hours

### 3.3. Architecture Design
- [ ] **System Architecture Document**
  - [ ] Architecture overview
  - [ ] Component diagram
  - [ ] Deployment diagram
  - [ ] Technology stack
  - [ ] Design patterns used
  - Estimated time: 4 hours

- [ ] **Database Design**
  - [ ] ER Diagram
  - [ ] Table descriptions
  - [ ] Relationships
  - [ ] Indexes
  - [ ] Constraints
  - Tool: dbdiagram.io or MySQL Workbench
  - Estimated time: 3 hours

- [ ] **API Documentation**
  - [ ] Setup Swagger/OpenAPI
  - [ ] Document all endpoints
  - [ ] Request/Response examples
  - [ ] Error codes
  - Estimated time: 4 hours

### 3.4. Test Plan
- [ ] **Test Strategy**
  - Test levels (unit, integration, system)
  - Test types (functional, performance, security)
  - Test environment
  - Estimated time: 2 hours

- [ ] **Test Cases**
  - [ ] Author test cases (20+ cases)
  - [ ] Reviewer test cases (15+ cases)
  - [ ] Chair test cases (25+ cases)
  - [ ] Admin test cases (10+ cases)
  - Format: Test ID, Description, Steps, Expected Result
  - Estimated time: 6 hours

- [ ] **Test Results**
  - Execute all test cases
  - Document results
  - Bug tracking
  - Estimated time: 4 hours

### 3.5. User Manual
- [ ] **Getting Started**
  - System requirements
  - How to access
  - Login/Register
  - Estimated time: 1 hour

- [ ] **Author Guide**
  - How to submit paper
  - How to edit/withdraw
  - How to view reviews
  - How to upload camera-ready
  - Screenshots for each step
  - Estimated time: 3 hours

- [ ] **Reviewer Guide**
  - How to view assignments
  - How to accept/decline
  - How to submit review
  - Review guidelines
  - Screenshots
  - Estimated time: 2 hours

- [ ] **Chair Guide**
  - How to create conference
  - How to assign reviewers
  - How to view progress
  - How to make decisions
  - How to generate reports
  - Screenshots
  - Estimated time: 4 hours

- [ ] **Admin Guide**
  - How to manage users
  - How to manage conferences
  - How to configure system
  - Screenshots
  - Estimated time: 2 hours

- [ ] **FAQ**
  - Common questions
  - Troubleshooting
  - Estimated time: 1 hour

### 3.6. Installation Guide
- [ ] **Prerequisites**
  - Hardware requirements
  - Software requirements
  - Network requirements
  - Estimated time: 1 hour

- [ ] **Installation Steps**
  - [ ] Install Docker
  - [ ] Clone repository
  - [ ] Configure environment variables
  - [ ] Build and run with Docker Compose
  - [ ] Verify installation
  - Estimated time: 2 hours

- [ ] **Configuration**
  - Database configuration
  - SMTP configuration
  - Firebase configuration
  - Security configuration
  - Estimated time: 2 hours

- [ ] **Troubleshooting**
  - Common issues
  - Solutions
  - Estimated time: 1 hour

---

## PHASE 4: MISSING FEATURES (Tuần 3-4) ⭐

### 4.1. Automatic Assignment by Keywords
- [ ] **Add keywords field to Paper**
  - Database migration
  - Update Paper entity
  - Update submission form
  - Estimated time: 2 hours

- [ ] **Add expertise field to User**
  - Database migration
  - Update User entity
  - Update profile form
  - Estimated time: 2 hours

- [ ] **Implement Matching Algorithm**
  - Calculate similarity score
  - Rank reviewers by match
  - Suggest top 3 reviewers
  - File: `backend/src/main/java/edu/uth/backend/assignment/AutoAssignmentService.java`
  - Estimated time: 6 hours

- [ ] **Add UI for Auto Assignment**
  - Button "Auto Suggest" in assignment page
  - Show suggested reviewers with scores
  - Chair can accept or modify
  - Estimated time: 3 hours

### 4.2. Internal Discussion Threads
- [ ] **Create Discussion Entity**
  - File: `backend/src/main/java/edu/uth/backend/entity/Discussion.java`
  - Fields: id, paperId, userId, message, parentId, createdAt
  - Estimated time: 1 hour

- [ ] **Create Discussion API**
  - POST /api/discussions - Create discussion
  - GET /api/discussions/paper/{paperId} - Get all discussions
  - Only PC members can see
  - Estimated time: 3 hours

- [ ] **Add Discussion UI**
  - Discussion thread component
  - Reply functionality
  - Show in Chair decision page
  - Estimated time: 4 hours

### 4.3. Rebuttal Phase
- [ ] **Add Rebuttal Entity**
  - File: `backend/src/main/java/edu/uth/backend/entity/Rebuttal.java`
  - Fields: id, paperId, authorId, content, createdAt
  - Estimated time: 1 hour

- [ ] **Add Rebuttal Window to Conference**
  - Add rebuttalStartDate, rebuttalEndDate
  - Update Conference entity
  - Estimated time: 1 hour

- [ ] **Create Rebuttal API**
  - POST /api/rebuttals - Submit rebuttal
  - GET /api/rebuttals/paper/{paperId} - Get rebuttal
  - Estimated time: 2 hours

- [ ] **Add Rebuttal UI**
  - Author can submit rebuttal
  - Reviewers can see rebuttal
  - Chair can see rebuttal
  - Estimated time: 4 hours

### 4.4. Public CFP Portal
- [ ] **Create Public Conference Page**
  - File: `frontend/src/pages/public/ConferencePublic.jsx`
  - Show CFP details
  - Show deadlines
  - Show tracks
  - Show accepted papers (if enabled)
  - No login required
  - Estimated time: 4 hours

- [ ] **Add Public API**
  - GET /api/public/conferences - List conferences
  - GET /api/public/conferences/{id} - Conference details
  - GET /api/public/conferences/{id}/accepted-papers
  - Estimated time: 2 hours

- [ ] **SEO Optimization**
  - Meta tags
  - Open Graph tags
  - Sitemap
  - Estimated time: 2 hours

---

## PHASE 5: POLISH & DEPLOYMENT (Tuần 4) ⭐

### 5.1. UI/UX Improvements
- [ ] **Loading States**
  - Add loading spinners
  - Skeleton screens
  - Progress indicators
  - Estimated time: 3 hours

- [ ] **Error Messages**
  - User-friendly error messages
  - Toast notifications
  - Error boundaries
  - Estimated time: 2 hours

- [ ] **Confirmation Dialogs**
  - Confirm before delete
  - Confirm before withdraw
  - Confirm before decision
  - Estimated time: 2 hours

- [ ] **Form Validation**
  - Client-side validation
  - Real-time feedback
  - Clear error messages
  - Estimated time: 3 hours

- [ ] **Responsive Design**
  - Test on mobile
  - Test on tablet
  - Fix layout issues
  - Estimated time: 4 hours

### 5.2. Performance Optimization
- [ ] **Add Redis Caching**
  - Cache conference list
  - Cache user profiles
  - Cache review statistics
  - Estimated time: 4 hours

- [ ] **Database Optimization**
  - Add indexes on foreign keys
  - Add indexes on frequently queried fields
  - Optimize slow queries
  - Estimated time: 3 hours

- [ ] **Frontend Optimization**
  - Code splitting
  - Lazy loading
  - Image optimization
  - Bundle size reduction
  - Estimated time: 4 hours

### 5.3. Security Hardening
- [ ] **Input Validation**
  - Validate all user inputs
  - Sanitize HTML
  - Prevent SQL injection
  - Prevent XSS
  - Estimated time: 3 hours

- [ ] **Rate Limiting**
  - Limit API requests
  - Prevent brute force
  - Estimated time: 2 hours

- [ ] **HTTPS Configuration**
  - SSL certificate
  - Force HTTPS
  - HSTS headers
  - Estimated time: 2 hours

- [ ] **Security Headers**
  - X-Frame-Options
  - X-Content-Type-Options
  - Content-Security-Policy
  - Estimated time: 1 hour

### 5.4. Monitoring & Logging
- [ ] **Setup Monitoring**
  - Application metrics
  - Database metrics
  - Server metrics
  - Tool: Prometheus + Grafana
  - Estimated time: 4 hours

- [ ] **Setup Alerting**
  - Email alerts for errors
  - Slack/Discord notifications
  - Estimated time: 2 hours

- [ ] **Log Aggregation**
  - Centralized logging
  - Tool: ELK Stack or Loki
  - Estimated time: 4 hours

### 5.5. Production Deployment
- [ ] **Setup Production Server**
  - Cloud provider (AWS, GCP, Azure)
  - Or VPS (DigitalOcean, Linode)
  - Estimated time: 2 hours

- [ ] **Configure Domain**
  - Buy domain
  - Configure DNS
  - Setup SSL
  - Estimated time: 2 hours

- [ ] **Deploy Application**
  - Deploy backend
  - Deploy frontend
  - Deploy database
  - Test production
  - Estimated time: 4 hours

- [ ] **Setup CI/CD**
  - GitHub Actions or GitLab CI
  - Auto deploy on push
  - Run tests before deploy
  - Estimated time: 4 hours

- [ ] **Backup Strategy**
  - Daily database backups
  - File backups
  - Disaster recovery plan
  - Estimated time: 3 hours

---

## PHASE 6: OPTIONAL FEATURES (Future) 💡

### 6.1. AI Features
- [ ] Spell/grammar checking
- [ ] Abstract summarization
- [ ] Keyword extraction
- [ ] Reviewer-paper similarity
- [ ] AI governance controls
- Estimated time: 40+ hours

### 6.2. Advanced Features
- [ ] Bidding system
- [ ] Program scheduling
- [ ] Proceedings generator
- [ ] Multi-tenancy
- [ ] Advanced analytics
- Estimated time: 60+ hours

---

## SUMMARY

### Time Estimates by Phase:
- **Phase 1 (Critical):** ~30 hours
- **Phase 2 (Testing):** ~50 hours
- **Phase 3 (Documentation):** ~70 hours
- **Phase 4 (Features):** ~40 hours
- **Phase 5 (Polish):** ~50 hours
- **Phase 6 (Optional):** 100+ hours

**Total for Production Ready:** ~240 hours (~6 weeks full-time)

### Priority Order:
1. 🔥 Phase 1 - Critical Fixes (MUST DO)
2. ⭐ Phase 3 - Documentation (MUST DO for academic project)
3. ⭐ Phase 2 - Testing (SHOULD DO)
4. ⭐ Phase 5 - Polish & Deployment (SHOULD DO)
5. ⭐ Phase 4 - Missing Features (NICE TO HAVE)
6. 💡 Phase 6 - Optional Features (FUTURE)

### Recommended Schedule:
- **Week 1:** Phase 1 (Critical Fixes)
- **Week 2:** Phase 3 (Documentation) + Phase 2 (Testing)
- **Week 3:** Phase 2 (Testing) + Phase 4 (Features)
- **Week 4:** Phase 5 (Polish & Deployment)
- **Week 5-6:** Buffer for issues and final testing

---

**Last Updated:** December 19, 2025
**Status:** Ready to start Phase 1
