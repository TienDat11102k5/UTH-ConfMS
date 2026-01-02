# Thiết Kế Chi Tiết (Detail Design Document)

## Thông Tin Tài Liệu

| Thông tin     | Chi tiết      |
| ------------- | ------------- |
| **Dự án**     | UTH-ConfMS    |
| **Phiên bản** | 1.0           |
| **Ngày tạo**  | Tháng 01/2026 |

---

## 1. Thiết Kế Backend

### 1.1 Cấu Trúc Package

```
edu.uth.backend/
│
├── config/                          # Cấu hình Spring
│   ├── SecurityConfig.java          # Cấu hình Spring Security
│   ├── CorsConfig.java              # CORS configuration
│   ├── RedisConfig.java             # Redis cache configuration
│   ├── FirebaseConfig.java          # Firebase Admin SDK
│   └── WebConfig.java               # Web MVC configuration
│
├── entity/                          # JPA Entities (24 entities)
│   ├── BaseEntity.java              # Abstract base entity
│   ├── User.java                    # Người dùng
│   ├── Role.java                    # Vai trò
│   ├── Conference.java              # Hội nghị
│   ├── Track.java                   # Track/chủ đề
│   ├── Paper.java                   # Bài báo
│   ├── PaperCoAuthor.java           # Đồng tác giả
│   ├── PaperStatus.java             # Enum trạng thái bài
│   ├── Review.java                  # Đánh giá
│   ├── ReviewAssignment.java        # Phân công reviewer
│   ├── AssignmentStatus.java        # Enum trạng thái phân công
│   ├── Discussion.java              # Thảo luận PC
│   ├── ConflictOfInterest.java      # Xung đột lợi ích
│   ├── AIFeatureFlag.java           # Cờ tính năng AI
│   ├── AIAuditLog.java              # Nhật ký AI
│   ├── AuditLog.java                # Nhật ký hệ thống
│   ├── UserActivityHistory.java     # Lịch sử hoạt động
│   ├── EmailDraft.java              # Bản nháp email
│   ├── PaperSynopsis.java           # Tóm tắt AI
│   ├── PasswordResetOtp.java        # OTP reset password
│   └── PasswordResetToken.java      # Token reset password
│
├── repository/                      # Spring Data JPA Repositories (18)
├── auth/                            # Module xác thực
├── submission/                      # Module nộp bài
├── review/                          # Module đánh giá
├── decision/                        # Module quyết định
├── admin/                           # Module quản trị
├── ai/                              # Module tích hợp AI
└── security/                        # Bảo mật
```

### 1.2 Thiết Kế Entity

#### 1.2.1 User Entity

```java
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 180)
    private String email;

    @Column(name = "password_hash", length = 255)
    @JsonIgnore
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AuthProvider provider = AuthProvider.LOCAL;

    @Column(name = "firebase_uid", length = 128)
    private String firebaseUid;

    @Column(name = "full_name", length = 180)
    private String fullName;

    @Column(name = "affiliation", length = 255)
    private String affiliation;

    @Column(nullable = false)
    private boolean enabled = true;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();
}
```

#### 1.2.2 Paper Entity

```java
@Entity
@Table(name = "papers")
public class Paper extends BaseEntity {
    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String abstractText;

    @Column(name = "file_path")
    private String filePath;

    @Column(name = "camera_ready_path")
    private String cameraReadyPath;

    @Enumerated(EnumType.STRING)
    private PaperStatus status = PaperStatus.SUBMITTED;

    @ManyToOne
    @JoinColumn(name = "main_author_id", nullable = false)
    private User mainAuthor;

    @ManyToOne
    @JoinColumn(name = "track_id", nullable = false)
    private Track track;

    @OneToMany(mappedBy = "paper", cascade = CascadeType.ALL)
    private List<PaperCoAuthor> coAuthors;
}
```

### 1.3 Thiết Kế Service Layer

#### 1.3.1 Submission Service

```java
@Service
@Transactional
public class SubmissionService {

    @Autowired
    private PaperRepository paperRepository;

    @Autowired
    private TrackRepository trackRepository;

    public Paper createSubmission(SubmissionRequest request, User author) {
        // 1. Validate track exists
        Track track = trackRepository.findById(request.getTrackId())
            .orElseThrow(() -> new NotFoundException("Track not found"));

        // 2. Check deadline
        Conference conf = track.getConference();
        if (LocalDateTime.now().isAfter(conf.getSubmissionDeadline())) {
            throw new DeadlinePassedException("Submission deadline passed");
        }

        // 3. Create paper
        Paper paper = new Paper();
        paper.setTitle(request.getTitle());
        paper.setAbstractText(request.getAbstractText());
        paper.setMainAuthor(author);
        paper.setTrack(track);
        paper.setStatus(PaperStatus.SUBMITTED);

        // 4. Save and return
        return paperRepository.save(paper);
    }
}
```

#### 1.3.2 Review Service

```java
@Service
public class ReviewService {

    public Review submitReview(Long assignmentId, ReviewRequest request, User reviewer) {
        // 1. Validate assignment
        ReviewAssignment assignment = assignmentRepository.findById(assignmentId)
            .orElseThrow(() -> new NotFoundException("Assignment not found"));

        // 2. Verify reviewer
        if (!assignment.getReviewer().getId().equals(reviewer.getId())) {
            throw new ForbiddenException("Not your assignment");
        }

        // 3. Create/update review
        Review review = assignment.getReview();
        if (review == null) {
            review = new Review();
            review.setAssignment(assignment);
        }

        review.setScore(request.getScore());
        review.setConfidenceLevel(request.getConfidenceLevel());
        review.setCommentForAuthor(request.getCommentForAuthor());
        review.setCommentForPC(request.getCommentForPC());
        review.setSubmittedAt(LocalDateTime.now());

        // 4. Update assignment status
        assignment.setStatus(AssignmentStatus.COMPLETED);

        return reviewRepository.save(review);
    }
}
```

### 1.4 Thiết Kế Controller Layer

#### 1.4.1 Auth Controller

```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        User user = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(UserResponse.fromEntity(user));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.sendOtp(request.getEmail());
        return ResponseEntity.ok(new MessageResponse("OTP sent to email"));
    }
}
```

#### 1.4.2 Submission Controller

```java
@RestController
@RequestMapping("/api/submissions")
@PreAuthorize("hasAnyRole('AUTHOR', 'ADMIN')")
public class SubmissionController {

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PaperResponse> createSubmission(
            @RequestPart("data") @Valid SubmissionRequest request,
            @RequestPart("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {

        User author = userService.findByEmail(userDetails.getUsername());
        Paper paper = submissionService.createSubmission(request, file, author);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(PaperResponse.fromEntity(paper));
    }

    @GetMapping("/my")
    public ResponseEntity<List<PaperResponse>> getMySubmissions(
            @AuthenticationPrincipal UserDetails userDetails) {
        User author = userService.findByEmail(userDetails.getUsername());
        return ResponseEntity.ok(
            submissionService.getByAuthor(author.getId())
                .stream()
                .map(PaperResponse::fromEntity)
                .toList()
        );
    }
}
```

### 1.5 Thiết Kế Security

#### 1.5.1 JWT Authentication Filter

```java
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response, FilterChain filterChain) {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);

            if (jwtUtils.validateToken(token)) {
                String email = jwtUtils.getEmailFromToken(token);
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());

                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }

        filterChain.doFilter(request, response);
    }
}
```

#### 1.5.2 Security Configuration

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }
}
```

---

## 2. Thiết Kế Frontend

### 2.1 Cấu Trúc Components

```
src/
├── components/
│   ├── Layout/
│   │   ├── AdminLayout.jsx          # Layout cho admin pages
│   │   ├── AuthorLayout.jsx         # Layout cho author pages
│   │   └── Sidebar.jsx              # Sidebar navigation
│   │
│   ├── SpellCheckButton.jsx         # AI spell check component
│   ├── AbstractPolishModal.jsx      # AI polish modal
│   ├── PaperSynopsisModal.jsx       # AI synopsis modal
│   ├── EmailDraftModal.jsx          # AI email draft modal
│   ├── Toast.jsx                    # Notification toast
│   ├── Pagination.jsx               # Pagination component
│   └── ProtectedRoute.jsx           # Route guard
│
└── pages/
    ├── admin/
    │   ├── AdminDashboardOverview.jsx
    │   ├── AdminConferences.jsx
    │   ├── AdminUserCreate.jsx
    │   ├── TenantManagement.jsx
    │   ├── AuditLogPage.jsx
    │   └── ...
    │
    ├── author/
    │   ├── AuthorDashboard.jsx
    │   ├── AuthorNewSubmissionPage.jsx
    │   ├── AuthorSubmissionListPage.jsx
    │   ├── AuthorCameraReadyPage.jsx
    │   └── ...
    │
    ├── chair/
    │   ├── ChairDashboard.jsx
    │   ├── ChairConferenceManager.jsx
    │   ├── ChairAssignmentManagement.jsx
    │   ├── ChairDecisionPage.jsx
    │   └── ...
    │
    └── reviewer/
        ├── ReviewerDashboard.jsx
        ├── ReviewerAssignments.jsx
        ├── ReviewerReviewForm.jsx
        └── ReviewerCOI.jsx
```

### 2.2 State Management Pattern

```javascript
// auth.js - Authentication state
export const getToken = () => localStorage.getItem("token");
export const setToken = (token) => localStorage.setItem("token", token);
export const removeToken = () => localStorage.removeItem("token");

export const getCurrentUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;

  // Check token expiration
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};
```

### 2.3 API Client Design

```javascript
// apiClient.js
import axios from "axios";
import { getToken, removeToken } from "./auth";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 2.4 Routing Design

```javascript
// App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Author routes */}
        <Route
          path="/author/*"
          element={
            <ProtectedRoute roles={["AUTHOR"]}>
              <AuthorRoutes />
            </ProtectedRoute>
          }
        />

        {/* Reviewer routes */}
        <Route
          path="/reviewer/*"
          element={
            <ProtectedRoute roles={["REVIEWER", "PC"]}>
              <ReviewerRoutes />
            </ProtectedRoute>
          }
        />

        {/* Chair routes */}
        <Route
          path="/chair/*"
          element={
            <ProtectedRoute roles={["CHAIR"]}>
              <ChairRoutes />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminRoutes />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 3. Thiết Kế AI Service

### 3.1 NLP Module

```python
# src/core/nlp/spell_checker.py
from typing import List, Dict
import google.generativeai as genai

class SpellChecker:
    def __init__(self, model_name: str = "gemini-1.5-flash"):
        self.model = genai.GenerativeModel(model_name)

    async def check(self, text: str, language: str = "en") -> Dict:
        prompt = f"""
        Check the following academic text for spelling and grammar errors.
        Return corrections in JSON format with:
        - original: the incorrect text
        - correction: the corrected text
        - explanation: brief explanation

        Text: {text}
        Language: {language}
        """

        response = await self.model.generate_content_async(prompt)
        return self._parse_response(response.text)
```

### 3.2 Synopsis Service

```python
# src/core/services/synopsis_service.py
class SynopsisService:

    async def generate_synopsis(self, paper_data: dict) -> dict:
        """Generate neutral synopsis for PC bidding"""

        prompt = f"""
        Generate a neutral academic synopsis (150-250 words) for PC bidding.
        Do NOT evaluate quality, just summarize:
        - Main claims/contributions
        - Methodology used
        - Key findings

        Title: {paper_data['title']}
        Abstract: {paper_data['abstract']}
        """

        response = await self.model.generate_content_async(prompt)

        # Extract keywords
        keywords = await self._extract_keywords(paper_data['abstract'])

        return {
            'synopsis': response.text,
            'keywords': keywords,
            'key_points': self._extract_key_points(response.text)
        }
```

### 3.3 AI Governance

```python
# src/core/governance/feature_flags.py
from functools import lru_cache

class FeatureFlagService:
    def __init__(self, db_session):
        self.db = db_session

    @lru_cache(maxsize=100)
    async def is_enabled(self, conference_id: int, feature_name: str) -> bool:
        """Check if AI feature is enabled for a conference"""
        result = await self.db.fetchrow(
            """
            SELECT enabled FROM ai_feature_flags
            WHERE conference_id = $1 AND feature_name = $2
            """,
            conference_id, feature_name
        )
        return result['enabled'] if result else False

    async def log_usage(self, log_entry: AuditLogEntry):
        """Log AI feature usage for audit"""
        await self.db.execute(
            """
            INSERT INTO ai_audit_logs
            (timestamp, conference_id, user_id, feature, action, prompt,
             model_id, input_hash, output_summary, accepted)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            """,
            log_entry.timestamp, log_entry.conference_id, ...
        )
```

---

## 4. Thiết Kế Database

### 4.1 Bảng Users

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(180) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL',
    firebase_uid VARCHAR(128),
    full_name VARCHAR(180),
    affiliation VARCHAR(255),
    avatar_url VARCHAR(500),
    phone VARCHAR(20),
    country VARCHAR(100),
    gender VARCHAR(10),
    address VARCHAR(500),
    date_of_birth DATE,
    bio TEXT,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
```

### 4.2 Bảng Papers

```sql
CREATE TABLE papers (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    abstract_text TEXT,
    file_path VARCHAR(500),
    camera_ready_path VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED',
    main_author_id BIGINT NOT NULL REFERENCES users(id),
    track_id BIGINT NOT NULL REFERENCES tracks(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_papers_author ON papers(main_author_id);
CREATE INDEX idx_papers_track ON papers(track_id);
CREATE INDEX idx_papers_status ON papers(status);
```

### 4.3 Indexes và Constraints

| Bảng               | Index                 | Mục đích                            |
| ------------------ | --------------------- | ----------------------------------- |
| users              | email (unique)        | Tìm kiếm nhanh theo email           |
| papers             | main_author_id        | Query bài theo tác giả              |
| papers             | track_id, status      | Filter bài theo track và trạng thái |
| review_assignments | paper_id, reviewer_id | Kiểm tra duplicate assignment       |
| discussions        | paper_id              | Lấy comments theo paper             |

---

## 5. API Endpoints

### 5.1 Authentication APIs

| Method | Endpoint                  | Mô tả             |
| ------ | ------------------------- | ----------------- |
| POST   | /api/auth/register        | Đăng ký tài khoản |
| POST   | /api/auth/login           | Đăng nhập         |
| POST   | /api/auth/google          | Đăng nhập Google  |
| POST   | /api/auth/forgot-password | Gửi OTP           |
| POST   | /api/auth/verify-otp      | Xác thực OTP      |
| POST   | /api/auth/reset-password  | Đặt lại mật khẩu  |

### 5.2 Submission APIs

| Method | Endpoint                           | Mô tả            |
| ------ | ---------------------------------- | ---------------- |
| POST   | /api/submissions                   | Nộp bài mới      |
| GET    | /api/submissions/my                | Lấy bài của tôi  |
| GET    | /api/submissions/{id}              | Chi tiết bài     |
| PUT    | /api/submissions/{id}              | Cập nhật bài     |
| DELETE | /api/submissions/{id}              | Rút bài          |
| POST   | /api/submissions/{id}/camera-ready | Nộp camera-ready |

### 5.3 Review APIs

| Method | Endpoint                 | Mô tả                |
| ------ | ------------------------ | -------------------- |
| GET    | /api/assignments/my      | Bài được phân công   |
| POST   | /api/assignments         | Phân công reviewer   |
| POST   | /api/reviews             | Nộp đánh giá         |
| GET    | /api/papers/{id}/reviews | Lấy đánh giá của bài |
| POST   | /api/coi                 | Khai báo COI         |

### 5.4 AI APIs

| Method | Endpoint                    | Mô tả             |
| ------ | --------------------------- | ----------------- |
| POST   | /api/ai/spell-check         | Kiểm tra chính tả |
| POST   | /api/ai/synopsis            | Tạo tóm tắt       |
| POST   | /api/ai/similarity          | Tính similarity   |
| POST   | /api/ai/email-draft         | Soạn email        |
| GET    | /api/ai/governance/{confId} | Lấy feature flags |

### 5.5 Admin APIs

| Method | Endpoint                     | Mô tả             |
| ------ | ---------------------------- | ----------------- |
| GET    | /api/admin/users             | Danh sách users   |
| PUT    | /api/admin/users/{id}/role   | Cập nhật vai trò  |
| PUT    | /api/admin/users/{id}/status | Bật/tắt tài khoản |
| PUT    | /api/admin/users/{id}/name   | Cập nhật họ tên   |
| DELETE | /api/admin/users/{id}        | Xóa user          |

**Cập nhật vai trò:**

```json
PUT /api/admin/users/5/role
{ "role": "REVIEWER" }  // AUTHOR, REVIEWER, CHAIR, ADMIN
```

**Bật/tắt tài khoản:**

```json
PUT /api/admin/users/5/status
{ "enabled": false }  // false = Disabled
```

---

## Tài Liệu Liên Quan

- [Sơ đồ UML](uml-diagrams.md)
- [Kiến trúc hệ thống](architecture.md)
- [Bảo mật](security-configuration.md)
