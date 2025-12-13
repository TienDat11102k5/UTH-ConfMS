# Hướng dẫn test và debug thông tin cá nhân

## Sau khi backend rebuild xong, làm theo các bước sau:

### 1. Mở trình duyệt và Developer Tools
- Truy cập: http://localhost:5173/profile
- Nhấn F12 để mở Developer Tools
- Chọn tab "Console" để xem logs

### 2. Test cập nhật thông tin
Thử nhập/sửa các trường:
- Số điện thoại: ví dụ "+84 123 456 789"
- Quốc gia: ví dụ "Việt Nam"
- Cơ quan/Tổ chức: ví dụ "Trường Đại học ABC"
- Giới thiệu bản thân: viết vài dòng

Sau đó nhấn nút "Lưu thay đổi"

### 3. Kiểm tra Console Logs
Bạn sẽ thấy:
```
Submitting profile update: {fullName: "...", phone: "...", ...}
Profile update response: {...}
```

Hoặc nếu có lỗi:
```
Profile update error: ...
Error response: ...
```

### 4. Kiểm tra Backend Logs
Mở PowerShell và chạy:
```powershell
docker logs uth_backend --tail 50
```

Tìm dòng:
```
Updating profile for user: your-email@example.com
Request data: fullName=..., phone=..., country=..., affiliation=...
Profile updated successfully for user: your-email@example.com
```

### 5. Nếu gặp lỗi

**Lỗi 401 Unauthorized:**
- Token hết hạn → Đăng nhập lại

**Lỗi 404 Not Found:**
- User không tồn tại trong database

**Lỗi Network/CORS:**
- Backend chưa chạy hoặc CORS chưa cấu hình đúng
- Kiểm tra: `docker ps` để xem backend có chạy không

**Không có response:**
- Kiểm tra Network tab trong Developer Tools
- Xem request có được gửi đi không
- Xem status code là gì (200, 401, 500, ...)

### 6. Thông tin hữu ích

Backend API:
- GET /api/user/profile - Lấy thông tin user
- PUT /api/user/profile - Cập nhật thông tin
- POST /api/user/upload-avatar - Upload avatar

Frontend logs sẽ hiển thị:
- Request data trước khi gửi
- Response data sau khi nhận
- Error details nếu có lỗi
