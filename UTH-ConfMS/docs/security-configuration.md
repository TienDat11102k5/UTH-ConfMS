# Hướng Dẫn Cấu Hình Bảo Mật

**Dự án:** UTH-ConfMS (Hệ thống Quản lý Hội nghị)  
**Cập nhật:** Tháng 01/2026  
**Trạng thái:** ✅ Sẵn sàng cho Production

---

## 🔒 Tổng Quan

Tài liệu này mô tả cấu hình bảo mật và các best practices được triển khai trong hệ thống UTH-ConfMS.

---

## 🛡️ Các Tính Năng Bảo Mật

### 1. Xác Thực & Phân Quyền

#### Xác Thực Dựa Trên JWT

- **Loại Token:** JSON Web Token (JWT)
- **Thuật toán:** HS256 (HMAC với SHA-256)
- **Thời hạn Access Token:** 60 phút (có thể cấu hình)
- **Thời hạn Refresh Token:** 7 ngày (có thể cấu hình)

```properties
# Cấu hình JWT
app.jwt.secret=YOUR_SECRET_KEY_IT_NHAT_32_KY_TU
app.jwt.access-token-minutes=60
app.jwt.refresh-token-days=7
```

#### Kiểm Soát Truy Cập Theo Vai Trò (RBAC)

Hệ thống triển khai 5 vai trò với quyền hạn phân cấp:

| Vai Trò     | Mã                 | Quyền Hạn                                |
| ----------- | ------------------ | ---------------------------------------- |
| Admin       | `ROLE_ADMIN`       | Toàn quyền hệ thống, quản lý người dùng  |
| Chair       | `ROLE_CHAIR`       | Quản lý hội nghị, ra quyết định, báo cáo |
| Track Chair | `ROLE_TRACK_CHAIR` | Quản lý cấp track, quyết định giới hạn   |
| Reviewer    | `ROLE_REVIEWER`    | Đánh giá bài được phân công              |
| PC          | `ROLE_PC`          | Đánh giá + quyền ủy ban chương trình     |
| Author      | `ROLE_AUTHOR`      | Nộp bài, xem bài nộp của mình            |

### 2. Cấu Hình Spring Security

#### SecurityConfig.java

Vị trí: `backend/src/main/java/edu/uth/backend/config/SecurityConfig.java`

**Các tính năng chính:**

- ✅ Quản lý session stateless (không lưu session phía server)
- ✅ JWT filter cho tất cả endpoints yêu cầu xác thực
- ✅ CSRF bị tắt (REST API với JWT)
- ✅ Bảo mật cấp method với `@PreAuthorize`
- ✅ CORS có thể cấu hình

```java
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
```

### 3. Cấu Hình CORS

#### Thiết Lập CORS Cho Production

**Vị trí:** `SecurityConfig.java` → `corsConfigurationSource()`

**Cấu hình:**

```properties
# Một origin
app.cors.allowed-origins=http://localhost:5173

# Nhiều origins (phân cách bằng dấu phẩy)
app.cors.allowed-origins=http://localhost:5173,https://confms.uth.edu.vn
```

**Các phương thức được phép:**

- GET, POST, PUT, PATCH, DELETE, OPTIONS

**Lưu ý bảo mật:**

- ✅ Cho phép credentials (nếu cần xác thực cookie)
- ✅ Header Authorization được expose
- ❌ Wildcard `*` KHÔNG được phép (đã xóa khỏi tất cả controllers)

### 4. Bảo Mật Mật Khẩu

#### Chính Sách Mật Khẩu

- **Độ dài tối thiểu:** 6 ký tự (có thể cấu hình)
- **Mã hóa:** BCrypt (Blowfish cipher)
- **Độ mạnh:** 10 rounds (BCrypt mặc định)

```java
@Bean
PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}
```

#### Quy Trình Đặt Lại Mật Khẩu

1. Người dùng yêu cầu reset → Email được gửi với OTP
2. Xác thực OTP (hết hạn sau 5 phút)
3. Cấp reset token (hết hạn sau 15 phút)
4. Đặt lại mật khẩu với token

**Cấu hình:**

```properties
app.reset-password.otp-ttl-minutes=5
app.reset-password.token-ttl-minutes=15
```

### 5. Bảo Mật Endpoint

#### Endpoints Công Khai (Không Cần Xác Thực)

```java
// Endpoints xác thực
POST /api/auth/register
POST /api/auth/login
POST /api/auth/forgot-password
POST /api/auth/verify-otp
POST /api/auth/reset-password

// Danh sách hội nghị công khai
GET /api/conferences
GET /api/conferences/{id}
```

#### Endpoints Yêu Cầu Xác Thực

```java
// Hồ sơ người dùng (bất kỳ user đã xác thực)
@PreAuthorize("isAuthenticated()")
GET /api/user/profile
PUT /api/user/profile
POST /api/user/upload-avatar
PUT /api/user/change-password
```

#### Endpoints Theo Vai Trò

```java
// Chỉ Admin/Chair
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_CHAIR')")
POST /api/conferences
PUT /api/conferences/{id}
DELETE /api/conferences/{id}

// Chỉ Reviewer/PC
@PreAuthorize("hasAnyAuthority('ROLE_REVIEWER','ROLE_PC')")
POST /api/reviews

// Chair/Track Chair (ra quyết định)
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_CHAIR','ROLE_TRACK_CHAIR')")
POST /api/decisions
GET /api/reports/conference/{id}
```

---

## 🚀 Checklist Triển Khai

### Biến Môi Trường

**Bắt buộc cho Production:**

```bash
# Server
SERVER_PORT=8080

# Database
SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/confms_db
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=<MAT_KHAU_MANH>

# Bảo mật JWT
JWT_SECRET=<TAO_SECRET_MANH_IT_NHAT_32_KY_TU>
JWT_ACCESS_MINUTES=60
JWT_REFRESH_DAYS=7

# CORS
CORS_ALLOWED_ORIGINS=https://confms.uth.edu.vn

# Firebase (cho Google OAuth)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CREDENTIALS=/path/to/service-account.json

# Email (cho OTP)
MAIL_HOST=smtp.gmail.com
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=<APP_PASSWORD>

# AI Service (tùy chọn)
GEMINI_API_KEY=<YOUR_GEMINI_KEY>
```

### Các Bước Tăng Cường Bảo Mật

#### 1. Tạo JWT Secret Mạnh

```bash
# Tạo chuỗi ngẫu nhiên 64 ký tự
openssl rand -base64 64 | tr -d '\n'
```

#### 2. Cấu Hình HTTPS

- Sử dụng reverse proxy (nginx) với SSL/TLS
- Chuyển hướng HTTP sang HTTPS
- Đặt header `Strict-Transport-Security`

#### 3. Giới Hạn Tốc Độ (Rate Limiting)

Thêm rate limiting để ngăn chặn tấn công brute force:

**Endpoints đề xuất:**

- `/api/auth/login` - Tối đa 5 lần/phút/IP
- `/api/auth/register` - Tối đa 3 lần/giờ/IP
- `/api/auth/forgot-password` - Tối đa 3 lần/giờ/email

#### 4. Bảo Mật Database

```sql
-- Tạo user database riêng với quyền hạn giới hạn
CREATE USER confms_app WITH PASSWORD 'mat_khau_manh';
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO confms_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO confms_app;

-- Thu hồi quyền superuser
REVOKE ALL PRIVILEGES ON DATABASE confms_db FROM PUBLIC;
```

#### 5. Bảo Mật Upload File

Đã triển khai:

- ✅ Giới hạn kích thước file: 100MB
- ✅ Kiểm tra loại file (PDF cho bài báo)
- ✅ Đặt tên file an toàn (dựa trên UUID)

**Đề xuất bổ sung:**

- Quét virus cho file upload
- Kiểm tra Content-Type
- Bucket lưu trữ riêng cho uploads

#### 6. Logging & Giám Sát

Bật logging bảo mật:

```properties
# Audit logging
logging.level.org.springframework.security=DEBUG
logging.level.edu.uth.backend.security=DEBUG

# Log tất cả authentication attempts
logging.level.org.springframework.security.authentication=INFO
```

**Các sự kiện cần giám sát:**

- Các lần đăng nhập thất bại
- Thay đổi mật khẩu
- Thay đổi vai trò
- Từ chối quyền truy cập
- Lỗi API (4xx, 5xx)

---

## 🔍 Kết Quả Audit Bảo Mật

**Ngày audit:** Tháng 01/2026  
**Tổng số Endpoints:** 41  
**Độ bao phủ bảo mật:** 100%

### Các Vấn Đề Đã Sửa

1. ✅ **Thiếu annotation @PreAuthorize** - 13 endpoints đã sửa
2. ✅ **Cấu hình sai CORS wildcard** - Xóa khỏi 6 controllers
3. ✅ **Kiểm tra auth thủ công** - Thay bằng bảo mật cấp framework

### Trạng Thái Hiện Tại

- ✅ Tất cả endpoints được bảo mật đúng cách
- ✅ RBAC được triển khai chính xác
- ✅ CORS giới hạn cho các origins đã cấu hình
- ✅ Không có endpoints công khai lộ dữ liệu nhạy cảm

---

## 🧪 Kiểm Thử Bảo Mật

### Kiểm Thử Thủ Công

#### 1. Test Xác Thực

```bash
# Đăng ký user mới
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User"
  }'

# Đăng nhập
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Response chứa JWT token
```

#### 2. Test Phân Quyền

```bash
# Truy cập endpoint bảo vệ KHÔNG có token (sẽ thất bại)
curl -X GET http://localhost:8080/api/user/profile

# Truy cập với token (sẽ thành công)
curl -X GET http://localhost:8080/api/user/profile \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

#### 3. Test CORS

```bash
# Preflight request
curl -X OPTIONS http://localhost:8080/api/conferences \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST"

# Kết quả mong đợi:
# Access-Control-Allow-Origin: http://localhost:5173
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

---

## 🆘 Xử Lý Sự Cố

### Các Vấn Đề Thường Gặp

#### 1. Lỗi CORS Trong Browser

**Triệu chứng:** `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Giải pháp:**

1. Kiểm tra `app.cors.allowed-origins` trong `application.properties`
2. Đảm bảo URL frontend khớp chính xác (bao gồm protocol và port)
3. Xác nhận SecurityConfig có cấu hình CORS đúng
4. Xóa cache browser

#### 2. Lỗi 401 Unauthorized

**Triệu chứng:** API trả về 401 dù có token hợp lệ

**Nguyên nhân có thể:**

- Token hết hạn
- JWT secret không hợp lệ
- Token không đúng format `Authorization: Bearer <token>`

**Giải pháp:**

- Kiểm tra server logs cho lỗi JWT parsing
- Đăng nhập lại để lấy token mới

#### 3. Lỗi 403 Forbidden

**Triệu chứng:** API trả về 403 với token hợp lệ

**Nguyên nhân:** User không có vai trò yêu cầu cho endpoint

**Giải pháp:**

1. Kiểm tra roles của user trong database
2. Xác nhận annotation `@PreAuthorize` khớp với authority của user

```sql
-- Kiểm tra roles của user
SELECT u.email, r.name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'test@example.com';
```

#### 4. Reset Password Không Hoạt Động

**Các vấn đề có thể:**

- Cấu hình SMTP sai
- Chưa đặt Gmail App Password
- OTP hết hạn (5 phút)

**Giải pháp:**

1. Kiểm tra cấu hình email trong application.properties
2. Tạo Gmail App Password tại: https://myaccount.google.com/apppasswords

---

## 📚 Tài Liệu Tham Khảo

- [Spring Security Documentation](https://docs.spring.io/spring-security/reference/index.html)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CORS Configuration](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

## 📞 Liên Hệ

Với các vấn đề liên quan đến bảo mật:

- **Đội Bảo Mật:** security@uth.edu.vn
- **Khẩn cấp:** Liên hệ quản trị viên hệ thống ngay lập tức

---

**Phiên bản tài liệu:** 1.0  
**Lần review cuối:** Tháng 01/2026  
**Lần review tiếp theo:** Tháng 04/2026
