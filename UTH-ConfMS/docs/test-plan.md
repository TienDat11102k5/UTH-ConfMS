# Kế Hoạch Kiểm Thử (Test Plan)

## Thông Tin Tài Liệu

| Thông tin     | Chi tiết      |
| ------------- | ------------- |
| **Dự án**     | UTH-ConfMS    |
| **Phiên bản** | 1.0           |
| **Ngày tạo**  | Tháng 01/2026 |

---

## 1. Tổng Quan

### 1.1 Phạm Vi

- Backend API (Spring Boot)
- Frontend (React)
- AI Service (Python FastAPI)
- Bảo mật hệ thống

### 1.2 Mục Tiêu

- Đảm bảo chức năng đúng yêu cầu
- Xác minh bảo mật và phân quyền
- Kiểm tra hiệu năng

---

## 2. Chiến Lược Kiểm Thử

| Loại             | Công cụ                          | Coverage Target     |
| ---------------- | -------------------------------- | ------------------- |
| Unit Test        | JUnit 5, Jest, Pytest            | 70%+                |
| Integration Test | Spring Boot Test, TestContainers | Key flows           |
| System Test      | Manual + Scripts                 | E2E flows           |
| Security Test    | Manual + Automated               | All endpoints       |
| UAT              | End users                        | Business validation |

---

## 3. Test Cases - Chức Năng

### 3.1 Authentication

| ID       | Test                   | Expected           | Priority   |
| -------- | ---------------------- | ------------------ | ---------- |
| AUTH-001 | Đăng ký hợp lệ         | 201 Created        | Cao        |
| AUTH-002 | Đăng ký email trùng    | 400 Error          | Cao        |
| AUTH-003 | Đăng nhập đúng         | JWT token          | Cao        |
| AUTH-004 | Đăng nhập sai password | 401 Unauthorized   | Cao        |
| AUTH-005 | Đăng nhập Google SSO   | JWT + user created | Cao        |
| AUTH-006 | Reset password với OTP | Password updated   | Trung bình |
| AUTH-007 | Token expired          | 401 Unauthorized   | Cao        |

### 3.2 Conference Management

| ID       | Test                | Expected       | Priority   |
| -------- | ------------------- | -------------- | ---------- |
| CONF-001 | Chair tạo hội nghị  | 201 Created    | Cao        |
| CONF-002 | Author tạo hội nghị | 403 Forbidden  | Cao        |
| CONF-003 | Thêm Track          | Track created  | Cao        |
| CONF-004 | Cập nhật deadline   | Deadline saved | Trung bình |

### 3.3 Submission

| ID      | Test                     | Expected                 | Priority   |
| ------- | ------------------------ | ------------------------ | ---------- |
| SUB-001 | Nộp bài với PDF hợp lệ   | Paper created, SUBMITTED | Cao        |
| SUB-002 | Nộp bài quá deadline     | 400 Error                | Cao        |
| SUB-003 | Nộp file không phải PDF  | 400 Error                | Cao        |
| SUB-004 | File quá 50MB            | 413 Error                | Trung bình |
| SUB-005 | Chỉnh sửa trước deadline | Paper updated            | Cao        |
| SUB-006 | Rút bài                  | Status = WITHDRAWN       | Trung bình |

### 3.4 Review Process

| ID      | Test                     | Expected           | Priority   |
| ------- | ------------------------ | ------------------ | ---------- |
| REV-001 | Chair phân công reviewer | Assignment created | Cao        |
| REV-002 | Phân công có COI         | 400 Error          | Cao        |
| REV-003 | Khai báo COI             | COI record created | Cao        |
| REV-004 | Nộp đánh giá             | Review saved       | Cao        |
| REV-005 | Từ chối assignment       | Status = DECLINED  | Trung bình |

### 3.5 AI Service

| ID     | Test              | Expected               | Priority   |
| ------ | ----------------- | ---------------------- | ---------- |
| AI-001 | Spell check       | Suggestions returned   | Trung bình |
| AI-002 | Generate synopsis | Synopsis 150-250 words | Trung bình |
| AI-003 | Feature disabled  | 403 Forbidden          | Cao        |
| AI-004 | AI audit logging  | Log created            | Cao        |

---

## 4. Test Cases - Bảo Mật

### 4.1 Authentication Security

```bash
# Test không có token
curl -X GET http://localhost:8080/api/user/profile
# Expected: 401 Unauthorized

# Test token không hợp lệ
curl -X GET http://localhost:8080/api/user/profile \
  -H "Authorization: Bearer invalid_token"
# Expected: 401 Unauthorized

# Test token hợp lệ
curl -X GET http://localhost:8080/api/user/profile \
  -H "Authorization: Bearer <VALID_TOKEN>"
# Expected: 200 OK
```

### 4.2 Authorization (RBAC)

```bash
# User thường tạo hội nghị (chỉ Admin/Chair)
curl -X POST http://localhost:8080/api/conferences \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}'
# Expected: 403 Forbidden

# Author nộp review (chỉ Reviewer)
curl -X POST http://localhost:8080/api/reviews \
  -H "Authorization: Bearer <AUTHOR_TOKEN>" \
  -d '{"assignmentId": 1, "score": 8}'
# Expected: 403 Forbidden
```

### 4.3 CORS

```bash
# Origin được phép
curl -X OPTIONS http://localhost:8080/api/conferences \
  -H "Origin: http://localhost:5173"
# Expected: Access-Control-Allow-Origin: http://localhost:5173

# Origin không được phép
curl -X OPTIONS http://localhost:8080/api/conferences \
  -H "Origin: http://evil.com"
# Expected: Không có CORS headers
```

### 4.4 SQL Injection

```bash
# Thử inject trong login
curl -X POST http://localhost:8080/api/auth/login \
  -d '{"email": "admin@example.com OR 1=1--", "password": "x"}'
# Expected: 401 (không phải SQL error)
```

### 4.5 XSS Prevention

```bash
# Submit với XSS
curl -X POST http://localhost:8080/api/submissions \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"title": "<script>alert(1)</script>"}'
# Expected: Script tags escaped trong response
```

### 4.6 Password Security

| Test                           | Expected             |
| ------------------------------ | -------------------- |
| OTP hết hạn (>5 phút)          | 400 Error            |
| Reset token hết hạn (>15 phút) | 400 Error            |
| Mật khẩu hiện tại sai          | 400 Error            |
| Mật khẩu < 6 ký tự             | 400 Validation error |

---

## 5. Môi Trường Test

### Hardware

- CPU: 2+ cores
- RAM: 4GB+
- Storage: 20GB SSD

### Software

- Docker 24+
- PostgreSQL 16
- Redis 7

### Test Data

- 10 users (2 admin, 2 chair, 3 reviewer, 3 author)
- 3 conferences, 10 tracks
- 50 papers, 100 assignments, 75 reviews

---

## 6. Tiêu Chí Đạt/Không Đạt

### Đạt (Pass)

- ✅ Tất cả test Priority Cao đều PASS
- ✅ Coverage ≥ 70%
- ✅ Không có Critical/High bugs
- ✅ Response time < 3s

### Không Đạt (Fail)

- ❌ Bất kỳ test Priority Cao FAIL
- ❌ Security vulnerability phát hiện
- ❌ Data loss/corruption
- ❌ System crash

---

## 7. Báo Cáo Lỗi

### Severity Levels

| Severity | Mô tả                    | Ví dụ                          |
| -------- | ------------------------ | ------------------------------ |
| Critical | Hệ thống không hoạt động | Server crash, data loss        |
| High     | Chức năng chính lỗi      | Login fail, không nộp bài được |
| Medium   | Chức năng bị ảnh hưởng   | Filter không hoạt động         |
| Low      | Vấn đề nhỏ               | UI alignment, typo             |

### Bug Report Template

```
Bug ID: BUG-XXX
Title: [Mô tả ngắn]
Severity: Critical/High/Medium/Low
Steps:
1. Step 1
2. Step 2
Expected: [Kết quả mong đợi]
Actual: [Kết quả thực tế]
```

---

## 8. Lịch Trình

| Giai đoạn           | Thời gian            |
| ------------------- | -------------------- |
| Unit Testing        | Liên tục             |
| Integration Testing | Sau mỗi sprint       |
| Security Testing    | Trước release        |
| System Testing      | Trước release        |
| UAT                 | 1 tuần trước release |

---

## 9. Phản Ứng Sự Cố Bảo Mật

Nếu phát hiện security issue:

1. **KHÔNG** công bố công khai
2. Ghi nhận: endpoint, impact, cách tái tạo
3. Thông báo: security@uth.edu.vn
4. Nếu critical: ngưng dịch vụ, kiểm tra logs
5. Fix → Re-test → Deploy → Monitor
