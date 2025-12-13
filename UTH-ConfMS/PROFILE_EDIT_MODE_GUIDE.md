# Hướng dẫn sử dụng Profile với chế độ chỉnh sửa mới

## ✅ Đã hoàn thành

### Frontend Changes:
1. ✅ Thêm chế độ Edit Mode (isEditing state)
2. ✅ Ban đầu các trường sẽ ở chế độ readonly/disabled
3. ✅ Hiển thị nút "Chỉnh sửa" thay vì "Hủy" và "Lưu thay đổi"
4. ✅ Khi click "Chỉnh sửa":
   - Cho phép edit các trường
   - Hiện 2 nút: "Hủy" và "Lưu thay đổi"
5. ✅ Khi click "Hủy":
   - Khôi phục dữ liệu gốc
   - Thoát edit mode
6. ✅ Khi click "Lưu thay đổi":
   - Lưu dữ liệu lên server
   - Tự động thoát edit mode nếu thành công

### Backend Status:
- ✅ Backend đang chạy ổn định (Up 19 minutes)
- ✅ Database (PostgreSQL) đang chạy
- ✅ Redis đang chạy
- ✅ API endpoints sẵn sàng

## 🎯 Cách sử dụng

### 1. Truy cập trang Profile
```
http://localhost:5173/profile
```

### 2. Chế độ xem (View Mode)
- Tất cả trường thông tin sẽ hiển thị nhưng không thể chỉnh sửa
- Chỉ có 1 nút "✏️ Chỉnh sửa" ở góc phải

### 3. Chế độ chỉnh sửa (Edit Mode)
**Bước 1:** Click nút "✏️ Chỉnh sửa"
- Các trường thông tin sẽ có thể chỉnh sửa
- Hiển thị 2 nút: "Hủy" và "Lưu thay đổi"

**Bước 2:** Chỉnh sửa thông tin
- Họ và tên
- Số điện thoại (ví dụ: +84 123 456 789)
- Quốc gia (ví dụ: Việt Nam)
- Cơ quan/Tổ chức (ví dụ: Trường Đại học ABC)
- Giới thiệu bản thân

**Bước 3a:** Nếu muốn hủy thay đổi
- Click nút "Hủy"
- Dữ liệu sẽ được khôi phục về ban đầu
- Quay lại chế độ xem

**Bước 3b:** Nếu muốn lưu thay đổi
- Click nút "Lưu thay đổi"
- Hệ thống sẽ lưu vào database
- Tự động quay lại chế độ xem
- Hiển thị thông báo "Cập nhật thông tin thành công!"

## 🔍 Kiểm tra lỗi (Debugging)

### Mở Developer Tools (F12)

#### Console Tab:
Sẽ thấy logs:
```javascript
Submitting profile update: {fullName: "...", phone: "...", ...}
Profile update response: {...}
```

Hoặc nếu lỗi:
```javascript
Profile update error: ...
Error response: {...}
```

#### Network Tab:
- Xem request PUT /api/user/profile
- Kiểm tra Status Code (200 = thành công, 401 = chưa đăng nhập, 500 = lỗi server)
- Xem Request Payload (dữ liệu gửi đi)
- Xem Response (dữ liệu nhận về)

### Kiểm tra Backend Logs:
```powershell
docker logs uth_backend --tail 30
```

Tìm dòng:
```
Updating profile for user: your-email@gmail.com
Request data: fullName=..., phone=..., country=..., affiliation=...
Profile updated successfully for user: your-email@gmail.com
```

## ⚠️ Lỗi phổ biến

### 1. Lỗi 401 Unauthorized
**Nguyên nhân:** Token đăng nhập hết hạn
**Giải pháp:** Đăng xuất và đăng nhập lại

### 2. Không thấy nút "Chỉnh sửa"
**Nguyên nhân:** Có thể đang ở edit mode rồi
**Giải pháp:** Refresh trang (F5)

### 3. Click "Lưu thay đổi" nhưng không lưu
**Kiểm tra:**
- Mở Console (F12) xem có lỗi không
- Mở Network tab xem request có được gửi không
- Kiểm tra backend logs

### 4. Trường bị disabled nhưng không thể edit khi click "Chỉnh sửa"
**Nguyên nhân:** Trường Email luôn disabled (không thể đổi email)
**Lưu ý:** Các trường khác: fullName, phone, country, affiliation, bio đều có thể edit

## 📊 Kiến trúc hoạt động

```
Frontend (UserProfilePage.jsx)
    ↓
    Click "Chỉnh sửa" → setIsEditing(true)
    ↓
    Chỉnh sửa dữ liệu → onChange updates formData
    ↓
    Click "Lưu thay đổi" → PUT /api/user/profile
    ↓
Backend (UserController.java)
    ↓
    Nhận request → Log data
    ↓
    Update user in database
    ↓
    Return UserProfileResponse
    ↓
Frontend nhận response
    ↓
    Update localStorage
    ↓
    setIsEditing(false) → Thoát edit mode
    ↓
    Hiển thị success message
```

## 🚀 Tính năng đã cải thiện

1. **UX tốt hơn:** 
   - Người dùng biết rõ khi nào đang xem và khi nào đang edit
   - Có thể hủy thay đổi một cách dễ dàng

2. **An toàn hơn:**
   - Không cho phép edit khi đang loading
   - Lưu bản sao gốc để có thể khôi phục

3. **Debug dễ hơn:**
   - Console logs chi tiết
   - Backend logs rõ ràng
   - Error handling tốt hơn

4. **Visual feedback:**
   - Các trường disabled có style khác biệt
   - Loading state khi đang lưu
   - Success/Error messages rõ ràng
