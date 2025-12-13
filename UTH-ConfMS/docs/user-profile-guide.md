# Hướng dẫn sử dụng tính năng Profile và Settings

## Tính năng đã triển khai

### 1. User Profile Dropdown (Dropdown thông tin người dùng)
- **Vị trí**: Góc phải header của tất cả trang dashboard
- **Chức năng**:
  - Hiển thị avatar/initials của người dùng
  - Hiển thị tên, email, vai trò
  - Link đến trang Profile
  - Link đến trang Settings  
  - Nút đăng xuất

### 2. User Profile Page (Trang thông tin cá nhân)
- **Đường dẫn**: `/profile`
- **Chức năng**:
  - Xem và chỉnh sửa thông tin cá nhân:
    - Họ và tên
    - Số điện thoại
    - Quốc gia
    - Cơ quan/Tổ chức
    - Giới thiệu bản thân
  - Upload và thay đổi ảnh đại diện (avatar)
    - Hỗ trợ: JPG, PNG, GIF
    - Kích thước tối đa: 5MB
  - Xem thông tin tài khoản (vai trò, trạng thái, ngày tạo)

### 3. Settings Page (Trang cài đặt)
- **Đường dẫn**: `/settings`
- **Chức năng**:
  - **Đổi mật khẩu** (chỉ cho tài khoản LOCAL):
    - Nhập mật khẩu hiện tại
    - Nhập mật khẩu mới (tối thiểu 6 ký tự)
    - Xác nhận mật khẩu mới
  - **Thông báo**: Quản lý cài đặt nhận thông báo
  - **Quyền riêng tư**: Quản lý hiển thị thông tin công khai

## Backend API Endpoints

### GET `/api/user/profile`
Lấy thông tin profile của người dùng hiện tại

**Response**:
```json
{
  "id": 1,
  "email": "user@example.com",
  "fullName": "Nguyễn Văn A",
  "affiliation": "Đại học ABC",
  "avatarUrl": "http://localhost:8080/uploads/avatars/xxx.jpg",
  "phone": "+84 xxx xxx xxx",
  "country": "Việt Nam",
  "bio": "Giới thiệu bản thân...",
  "role": "ROLE_AUTHOR",
  "provider": "GOOGLE"
}
```

### PUT `/api/user/profile`
Cập nhật thông tin profile

**Request Body**:
```json
{
  "fullName": "Nguyễn Văn A",
  "phone": "+84 xxx xxx xxx",
  "affiliation": "Đại học ABC",
  "country": "Việt Nam",
  "bio": "Giới thiệu bản thân..."
}
```

### POST `/api/user/upload-avatar`
Upload ảnh đại diện

**Request**: `multipart/form-data`
- Field name: `avatar`
- File type: image/*
- Max size: 5MB

### PUT `/api/user/change-password`
Đổi mật khẩu (chỉ cho tài khoản LOCAL)

**Request Body**:
```json
{
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
```

## Database Changes

Đã thêm các trường mới vào bảng `users`:
- `phone` VARCHAR(20)
- `country` VARCHAR(100)
- `bio` VARCHAR(1000)

## Cấu hình Backend

### application.properties
```properties
# Upload directory
app.upload.dir=uploads
app.base.url=http://localhost:8080
```

## Hướng dẫn sử dụng

### Sau khi đăng nhập Google thành công:

1. **Xem thông tin cá nhân**:
   - Click vào avatar/tên người dùng ở góc phải header
   - Chọn "Thông tin cá nhân"
   
2. **Chỉnh sửa profile**:
   - Vào trang Profile
   - Cập nhật thông tin cần thiết
   - Click "Lưu thay đổi"

3. **Thay đổi avatar**:
   - Vào trang Profile
   - Click "Thay đổi ảnh đại diện"
   - Chọn file ảnh (JPG/PNG/GIF, tối đa 5MB)
   - Ảnh sẽ được upload và hiển thị ngay lập tức

4. **Đổi mật khẩu** (chỉ tài khoản đăng ký bằng email):
   - Click vào avatar → chọn "Cài đặt"
   - Nhập mật khẩu hiện tại
   - Nhập mật khẩu mới và xác nhận
   - Click "Đổi mật khẩu"

5. **Đăng xuất**:
   - Click vào avatar/tên người dùng
   - Chọn "Đăng xuất"

## Lưu ý

- Tài khoản Google không thể đổi mật khẩu trong hệ thống (phải đổi trên Google)
- Email không thể thay đổi sau khi tạo tài khoản
- Ảnh avatar được lưu trong thư mục `uploads/avatars/` trên server
- Tất cả các endpoint đều yêu cầu authentication (JWT token)

## Migration Database

Nếu đang chạy với `spring.jpa.hibernate.ddl-auto=update`, các trường mới sẽ được tự động thêm vào database.

Nếu cần chạy migration thủ công:

```sql
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE users ADD COLUMN country VARCHAR(100);
ALTER TABLE users ADD COLUMN bio VARCHAR(1000);
```
