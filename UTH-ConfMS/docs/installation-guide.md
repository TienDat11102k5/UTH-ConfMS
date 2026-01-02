# Hướng Dẫn Cài Đặt (Installation Guide)

## Thông Tin Tài Liệu

| Thông tin     | Chi tiết      |
| ------------- | ------------- |
| **Dự án**     | UTH-ConfMS    |
| **Phiên bản** | 1.0           |
| **Ngày tạo**  | Tháng 01/2026 |

---

## 1. Yêu Cầu Hệ Thống

### 1.1 Yêu Cầu Phần Cứng

| Thành phần | Tối thiểu | Khuyến nghị |
| ---------- | --------- | ----------- |
| CPU        | 2 cores   | 4 cores     |
| RAM        | 4 GB      | 8 GB        |
| Disk       | 20 GB     | 50 GB SSD   |
| Network    | 10 Mbps   | 100 Mbps    |

### 1.2 Yêu Cầu Phần Mềm

| Phần mềm   | Phiên bản | Ghi chú             |
| ---------- | --------- | ------------------- |
| Java JDK   | 17+       | OpenJDK hoặc Oracle |
| Node.js    | 18+       | Bao gồm npm         |
| Python     | 3.11+     | Cho AI Service      |
| PostgreSQL | 16+       | Database            |
| Redis      | 7+        | Cache (optional)    |
| Docker     | 24+       | Cho deployment      |
| Git        | 2.40+     | Version control     |

---

## 2. Cài Đặt Nhanh với Docker (Khuyến nghị)

### 2.1 Clone Repository

```bash
git clone https://github.com/your-org/UTH-ConfMS.git
cd UTH-ConfMS
```

### 2.2 Cấu Hình Environment

```bash
cd docker
cp .env.example .env
```

Chỉnh sửa file `.env`:

```properties
# JWT Secret (QUAN TRỌNG - thay đổi giá trị này!)
JWT_SECRET=thay_bang_chuoi_dai_it_nhat_64_ky_tu_ngau_nhien

# Gemini API Key
GEMINI_API_KEY=your_gemini_api_key

# Email Configuration
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your_app_password
```

### 2.3 Khởi Chạy Hệ Thống

```bash
docker-compose up -d
```

### 2.4 Kiểm Tra Trạng Thái

```bash
docker-compose ps
```

Kết quả mong đợi:

```
NAME            STATUS       PORTS
uth_frontend    Up           0.0.0.0:3000->80/tcp
uth_backend     Up           0.0.0.0:8080->8080/tcp
uth_ai          Up           0.0.0.0:8001->8000/tcp
uth_db          Up           0.0.0.0:5435->5432/tcp
uth_redis       Up           0.0.0.0:6379->6379/tcp
```

### 2.5 Truy Cập

| Service     | URL                       |
| ----------- | ------------------------- |
| Frontend    | http://localhost:3000     |
| Backend API | http://localhost:8080/api |
| AI Service  | http://localhost:8001     |

---

## 3. Cài Đặt Thủ Công (Development)

### 3.1 Cài Đặt Database

```sql
-- Kết nối PostgreSQL
psql -U postgres

-- Tạo database
CREATE DATABASE confms_db;

-- Tạo user (optional)
CREATE USER confms_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE confms_db TO confms_user;

-- Thoát
\q
```

### 3.2 Cài Đặt Backend

```bash
cd backend

# Copy environment file
cp .env.example .env

# Chỉnh sửa .env với thông tin của bạn
# (xem mẫu bên dưới)

# Build
./mvnw clean install -DskipTests

# Chạy
./mvnw spring-boot:run
```

**File .env cho Backend:**

```properties
SERVER_PORT=8080

# Database
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/confms_db
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=your_password

# JWT (thay đổi!)
JWT_SECRET=your_very_long_secret_key_at_least_32_characters
JWT_EXPIRATION_MS=86400000

# Firebase
FIREBASE_PROJECT_ID=your-firebase-project
FIREBASE_CREDENTIALS=./uth-confms-firebase-sa.json

# Mail
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your_app_password

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173

# AI Service
AI_SERVICE_URL=http://localhost:8000
```

### 3.3 Cài Đặt Frontend

```bash
cd frontend

# Copy environment file
cp .env.example .env

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev
```

**File .env cho Frontend:**

```properties
VITE_API_BASE_URL=http://localhost:8080/api

# Firebase (lấy từ Firebase Console)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
```

### 3.4 Cài Đặt AI Service

```bash
cd ai-service

# Tạo virtual environment
python -m venv venv

# Kích hoạt
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Cài dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Chạy service
uvicorn src.app.main:app --reload --port 8000
```

**File .env cho AI Service:**

```properties
# Gemini AI
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
MODEL_NAME=gemini-1.5-flash

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/confms_db

# Server
HOST=0.0.0.0
PORT=8000
```

---

## 4. Cấu Hình Bổ Sung

### 4.1 Firebase Setup

1. Truy cập [Firebase Console](https://console.firebase.google.com)
2. Tạo project mới hoặc chọn project có sẵn
3. Vào **Project Settings** > **Service Accounts**
4. Click **Generate new private key**
5. Lưu file JSON vào `backend/uth-confms-firebase-sa.json`
6. Vào **Authentication** > **Sign-in method** > Enable **Google**

### 4.2 Gmail App Password

1. Vào [Google Account Security](https://myaccount.google.com/security)
2. Bật **2-Step Verification**
3. Tạo **App Password** cho "Mail"
4. Sử dụng password này trong `MAIL_PASSWORD`

### 4.3 Gemini API Key

1. Truy cập [Google AI Studio](https://makersuite.google.com/)
2. Click **Get API Key**
3. Tạo API key mới
4. Sử dụng key này trong `GEMINI_API_KEY`

---

## 5. Xác Minh Cài Đặt

### 5.1 Kiểm Tra Backend

```bash
curl http://localhost:8080/api/health
```

Kết quả mong đợi:

```json
{ "status": "UP" }
```

### 5.2 Kiểm Tra Frontend

Mở browser, truy cập: http://localhost:3000 (Docker) hoặc http://localhost:5173 (Dev)

### 5.3 Kiểm Tra AI Service

```bash
curl http://localhost:8000/health
```

### 5.4 Tạo Admin User

```bash
# Kết nối database
# Docker:
docker exec -it uth_db psql -U postgres -d confms_db

# Manual:
psql -U postgres -d confms_db
```

```sql
-- Tạo role ADMIN
INSERT INTO roles (name) VALUES ('ADMIN') ON CONFLICT DO NOTHING;

-- Lấy role_id
SELECT id FROM roles WHERE name = 'ADMIN';

-- Gán ADMIN role cho user (thay user_id)
INSERT INTO user_roles (user_id, role_id) VALUES (1, 1);
```

---

## 6. Xử Lý Sự Cố

### 6.1 Lỗi Thường Gặp

| Lỗi                         | Nguyên nhân            | Giải pháp                     |
| --------------------------- | ---------------------- | ----------------------------- |
| Port already in use         | Port đã được sử dụng   | Đổi port hoặc kill process    |
| Database connection refused | PostgreSQL chưa chạy   | Khởi động PostgreSQL          |
| CORS error                  | Origin không được phép | Thêm vào CORS config          |
| JWT invalid                 | Token sai hoặc expired | Kiểm tra JWT_SECRET           |
| Firebase auth failed        | Credentials sai        | Kiểm tra file service account |

### 6.2 Lệnh Debug

```bash
# Xem logs Docker
docker-compose logs -f uth_backend

# Kiểm tra database
docker exec -it uth_db psql -U postgres -d confms_db

# Restart services
docker-compose restart

# Rebuild và restart
docker-compose up -d --build
```

---

## 7. Tiếp Theo

Sau khi cài đặt thành công:

1. Đọc [Hướng dẫn sử dụng](user-guide.md)
2. Tạo tài khoản Admin đầu tiên
3. Tạo hội nghị thử nghiệm
4. Nộp bài test

---

## Tài Liệu Liên Quan

- [Hướng dẫn sử dụng](user-guide.md)
- [Hướng dẫn triển khai](system-implementation.md)
- [Kiến trúc hệ thống](architecture.md)
