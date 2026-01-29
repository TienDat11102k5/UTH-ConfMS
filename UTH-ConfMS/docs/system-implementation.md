# Hướng Dẫn Triển Khai Hệ Thống (System Implementation Guide)

## Thông Tin Tài Liệu

| Thông tin     | Chi tiết      |
| ------------- | ------------- |
| **Dự án**     | UTH-ConfMS    |
| **Phiên bản** | 1.0           |
| **Ngày tạo**  | Tháng 01/2026 |

---

## 1. Cài Đặt Môi Trường Phát Triển

### 1.1 Yêu Cầu Hệ Thống

| Thành phần | Phiên bản tối thiểu | Ghi chú                      |
| ---------- | ------------------- | ---------------------------- |
| Java JDK   | 21+                 | OpenJDK hoặc Oracle JDK      |
| Node.js    | 20+                 | Bao gồm npm                  |
| Python     | 3.11+               | Cho AI Service               |
| PostgreSQL | 16+                 | Database chính               |
| Redis      | 7+                  | Caching (optional)           |
| Docker     | 24+                 | Cho containerized deployment |
| Git        | 2.40+               | Version control              |

### 1.2 Cài Đặt Backend

```bash
# 1. Clone repository
git clone https://github.com/your-org/UTH-ConfMS.git
cd UTH-ConfMS

# 2. Di chuyển vào thư mục backend
cd backend

# 3. Copy file environment
cp .env.example .env

# 4. Chỉnh sửa file .env với thông tin của bạn
# Các biến quan trọng:
#   - DATABASE_URL
#   - JWT_SECRET
#   - MAIL_USERNAME, MAIL_PASSWORD
#   - FIREBASE_PROJECT_ID

# 5. Build project
./mvnw clean install -DskipTests

# 6. Chạy ứng dụng
./mvnw spring-boot:run
```

**Cấu hình .env cho Backend:**

```properties
# Server
SERVER_PORT=8080

# Database
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/confms_db
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=your_password

# JWT
JWT_SECRET=your_very_long_secret_key_at_least_32_characters
JWT_EXPIRATION_MS=86400000

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CREDENTIALS=./path/to/service-account.json

# Mail
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173

# AI Service
AI_SERVICE_URL=http://localhost:8000
```

### 1.3 Cài Đặt Frontend

```bash
# 1. Di chuyển vào thư mục frontend
cd frontend

# 2. Copy file environment
cp .env.example .env

# 3. Cài đặt dependencies
npm install

# 4. Chạy development server
npm run dev
```

**Cấu hình .env cho Frontend:**

```properties
VITE_API_BASE_URL=http://localhost:8080/api

# Firebase (từ Firebase Console)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 1.4 Cài Đặt AI Service

```bash
# 1. Di chuyển vào thư mục ai-service
cd ai-service

# 2. Tạo virtual environment
python -m venv venv

# 3. Kích hoạt virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 4. Cài đặt dependencies
pip install -r requirements.txt

# 5. Copy file environment
cp .env.example .env

# 6. Chạy service
uvicorn src.app.main:app --reload --port 8000
```

**Cấu hình .env cho AI Service:**

```properties
# AI Provider
AI_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key
MODEL_NAME=gemini-1.5-flash
MAX_TOKENS=2000
TEMPERATURE=0.3

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/confms_db

# Redis
REDIS_URL=redis://localhost:6379

# Server
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=info
```

---

## 2. Hướng Dẫn Triển Khai

### 2.1 Coding Standards

#### Java (Backend)

- Tuân theo Google Java Style Guide
- Sử dụng Lombok để giảm boilerplate
- Đặt tên class: PascalCase
- Đặt tên method/variable: camelCase
- Đặt tên constant: UPPER_SNAKE_CASE

```java
// Good
public class UserService {
    private static final int MAX_RETRY = 3;

    public User findByEmail(String email) {
        // implementation
    }
}
```

#### JavaScript (Frontend)

- Sử dụng ESLint với cấu hình dự án
- Functional components với Hooks
- Đặt tên component: PascalCase
- Đặt tên file: PascalCase.jsx

```javascript
// Good
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // fetch user
  }, [userId]);

  return <div>{user?.name}</div>;
}
```

#### Python (AI Service)

- Tuân theo PEP 8
- Type hints cho function parameters
- Docstrings cho public functions

```python
# Good
async def check_spelling(text: str, language: str = "en") -> dict:
    """
    Check spelling and grammar in the given text.

    Args:
        text: The text to check
        language: Language code (default: "en")

    Returns:
        Dictionary with corrections and suggestions
    """
    pass
```

### 2.2 Git Workflow

```
main (production)
  │
  ├── develop (integration)
  │     │
  │     ├── feature/conf-management
  │     ├── feature/review-system
  │     └── feature/ai-integration
  │
  └── hotfix/security-patch
```

**Quy trình:**

1. Tạo branch từ `develop`: `git checkout -b feature/new-feature`
2. Commit changes với message rõ ràng
3. Push branch và tạo Pull Request
4. Code review và merge vào `develop`
5. Merge `develop` vào `main` khi release

**Commit Message Format:**

```
<type>: <short description>

<optional body>

<optional footer>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `security`

### 2.3 Testing Strategy

| Level            | Tool                | Coverage Target |
| ---------------- | ------------------- | --------------- |
| Unit Test        | JUnit 5, Jest       | 70%+            |
| Integration Test | Spring Test, Pytest | Key flows       |
| E2E Test         | Manual              | Critical paths  |
| Security Test    | Manual              | All endpoints   |

---

## 3. Deployment

### 3.1 Docker Deployment

```bash
# 1. Di chuyển vào thư mục docker
cd docker

# 2. Copy file environment
cp .env.example .env

# 3. Chỉnh sửa .env với production values

# 4. Build và chạy
docker-compose up -d --build

# 5. Xem logs
docker-compose logs -f

# 6. Kiểm tra trạng thái
docker-compose ps
```

**Các container sẽ chạy:**

| Container    | Port | Mô tả               |
| ------------ | ---- | ------------------- |
| uth_frontend | 3000 | React app với Nginx |
| uth_backend  | 8080 | Spring Boot API     |
| uth_ai       | 8001 | Python AI Service   |
| uth_db       | 5435 | PostgreSQL database |
| uth_redis    | 6379 | Redis cache         |
| uth_backup   | -    | Backup automation   |

### 3.2 Production Deployment

**Checklist trước deployment:**

- [ ] Set `JWT_SECRET` với chuỗi dài 64+ ký tự
- [ ] Cấu hình `CORS_ALLOWED_ORIGINS` chính xác
- [ ] Set database credentials mạnh
- [ ] Enable HTTPS/SSL
- [ ] Cấu hình email service
- [ ] Test backup/restore
- [ ] Review security settings

### 3.3 CI/CD Pipeline

**GitHub Actions Workflow:**

```yaml
# .github/workflows/main.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: "17"

      - name: Run Backend Tests
        run: cd backend && ./mvnw test

      - name: Run Frontend Tests
        run: cd frontend && npm ci && npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Build Docker Images
        run: docker-compose -f docker/docker-compose.yml build
```

---

## 4. Bảo Trì

### 4.1 Logging

**Backend Logging Levels:**

| Level | Sử dụng                                     |
| ----- | ------------------------------------------- |
| ERROR | Lỗi nghiêm trọng, cần xử lý ngay            |
| WARN  | Cảnh báo, có thể ảnh hưởng                  |
| INFO  | Thông tin quan trọng (requests, operations) |
| DEBUG | Chi tiết debug (không dùng production)      |

```java
// application.properties
logging.level.root=INFO
logging.level.edu.uth.backend=DEBUG
logging.file.name=logs/application.log
logging.pattern.file=%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n
```

### 4.2 Monitoring

**Health Check Endpoints:**

| Service    | Endpoint             | Mô tả              |
| ---------- | -------------------- | ------------------ |
| Backend    | GET /actuator/health | Spring Boot health |
| AI Service | GET /health          | FastAPI health     |
| Frontend   | GET /                | Nginx status       |

**Metrics quan trọng:**

- Response time (p50, p95, p99)
- Error rate
- Active connections
- Database pool usage
- Redis hit ratio

### 4.3 Backup và Recovery

**Automated Backup:**

- Chạy tự động mỗi 24 giờ
- Lưu trữ 7 ngày gần nhất
- Compressed với gzip

```bash
# Manual backup
./scripts/backup-database.sh

# Manual restore
./scripts/restore-database.sh /path/to/backup.sql.gz
```

**Backup Location:** `./backups/`

---

## 5. Cấu Hình Timezone

Toàn bộ hệ thống sử dụng **Asia/Ho_Chi_Minh (UTC+7)**.

### 5.1 Backend

**application.properties:**

```properties
spring.jpa.properties.hibernate.jdbc.time_zone=Asia/Ho_Chi_Minh
spring.jackson.time-zone=Asia/Ho_Chi_Minh
spring.jackson.date-format=yyyy-MM-dd HH:mm:ss
```

**DateTimeUtil:**

```java
// Lấy thời gian hiện tại Việt Nam
LocalDateTime now = DateTimeUtil.nowVietnam();

// Format hiển thị
String display = DateTimeUtil.formatDisplay(localDateTime);
// Output: "02/01/2026 15:30:45"
```

### 5.2 Frontend

```javascript
import { formatDateTime, formatRelativeTime } from "../utils/dateUtils";

// Format đầy đủ: "02/01/2026 15:30:45"
formatDateTime(isoString);

// Relative: "5 phút trước"
formatRelativeTime(isoString);
```

**Best Practices:**

- Backend: Dùng `DateTimeUtil.nowVietnam()` thay vì `LocalDateTime.now()`
- Frontend: Dùng `formatDateTime()` thay vì `toLocaleString()`

---

## 6. Troubleshooting

### 5.1 Lỗi Thường Gặp

| Lỗi                | Nguyên nhân            | Giải pháp                  |
| ------------------ | ---------------------- | -------------------------- |
| Connection refused | Service chưa chạy      | Kiểm tra docker-compose ps |
| 401 Unauthorized   | Token expired          | Đăng nhập lại              |
| 403 Forbidden      | Không có quyền         | Kiểm tra role              |
| 500 Server Error   | Backend crash          | Xem logs                   |
| CORS error         | Origin không được phép | Thêm vào CORS config       |

### 5.2 Debug Commands

```bash
# Xem logs backend
docker-compose logs -f uth_backend

# Xem logs database
docker-compose logs -f uth_db

# Kết nối database
docker exec -it uth_db psql -U postgres -d confms_db

# Restart service
docker-compose restart uth_backend
```

---

## Tài Liệu Liên Quan

- [Hướng dẫn cài đặt](installation-guide.md)
- [Kiến trúc hệ thống](architecture.md)
- [Kế hoạch kiểm thử](test-plan.md)
