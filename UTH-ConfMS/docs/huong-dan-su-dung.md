# Hướng Dẫn Sử Dụng - UTH-ConfMS

## Thông Tin Tài Liệu

| Trường | Giá trị |
|--------|---------|
| **Dự án** | Hệ thống Quản lý Hội nghị Khoa học UTH (UTH-ConfMS) |
| **Phiên bản** | 1.0 |
| **Ngày tạo** | Tháng 01/2026 |
| **Đối tượng** | Tác giả, Reviewer, Chair, Admin |

---

## Giới Thiệu

UTH-ConfMS là hệ thống quản lý hội nghị khoa học toàn diện, hỗ trợ quy trình từ Call for Papers đến xuất bản Proceedings. Hệ thống cung cấp các chức năng cho 4 vai trò chính:

- **👤 Author (Tác giả)**: Nộp bài, theo dõi kết quả
- **📝 Reviewer (Người đánh giá)**: Đánh giá bài báo
- **👔 Chair (Chủ tịch)**: Quản lý hội nghị, phân công reviewer, ra quyết định
- **⚙️ Admin (Quản trị viên)**: Quản lý người dùng, hệ thống

---

## 1. Bắt Đầu

### 1.1 Truy Cập Hệ Thống

Mở trình duyệt và truy cập: **http://localhost:3000** (hoặc domain của bạn)

### 1.2 Đăng Ký Tài Khoản

1. Click nút **"Đăng ký"** trên trang chủ
2. Điền thông tin:
   - **Email**: Email hợp lệ (dùng để đăng nhập)
   - **Mật khẩu**: Tối thiểu 8 ký tự
   - **Họ tên**: Họ tên đầy đủ
   - **Đơn vị**: Tên trường/tổ chức
3. Click **"Đăng ký"**
4. Kiểm tra email xác thực (nếu được bật)

### 1.3 Đăng Nhập

**Cách 1: Đăng nhập bằng Email**
1. Nhập email và mật khẩu
2. Click **"Đăng nhập"**

**Cách 2: Đăng nhập bằng Google**
1. Click nút **"Đăng nhập với Google"**
2. Chọn tài khoản Google
3. Cho phép quyền truy cập

### 1.4 Quên Mật Khẩu

1. Click **"Quên mật khẩu?"**
2. Nhập email đã đăng ký
3. Kiểm tra email nhận mã OTP (6 số)
4. Nhập OTP và mật khẩu mới
5. Click **"Đặt lại mật khẩu"**

---

## 2. Hướng Dẫn Cho Tác Giả (Author)

### 2.1 Xem Danh Sách Hội Nghị

1. Vào menu **"Hội nghị"**
2. Xem danh sách hội nghị đang mở
3. Click vào hội nghị để xem chi tiết:
   - Tên hội nghị
   - Thời gian tổ chức
   - **Deadline nộp bài** (quan trọng!)
   - Các Track/Topic
   - Yêu cầu format

### 2.2 Nộp Bài Báo

1. Vào **"Hội nghị"** → Chọn hội nghị → Click **"Nộp bài"**
2. Điền thông tin bài báo:
   - **Tiêu đề**: Tiêu đề bài báo (tiếng Anh)
   - **Abstract**: Tóm tắt (150-250 từ)
   - **Keywords**: Từ khóa (phân cách bằng dấu phẩy)
   - **Track**: Chọn track phù hợp
   - **File PDF**: Upload file bài báo (tối đa 50MB)
3. Thêm đồng tác giả (nếu có):
   - Click **"Thêm đồng tác giả"**
   - Nhập: Họ tên, Email, Đơn vị
4. Click **"Nộp bài"**
5. Nhận thông báo xác nhận qua email

**Lưu ý:**
- ✅ File phải là PDF
- ✅ Kích thước tối đa 50MB
- ✅ Nộp trước deadline
- ✅ Mỗi bài chỉ nộp 1 lần vào 1 track

### 2.3 Chỉnh Sửa Bài Báo

1. Vào **"Bài báo của tôi"**
2. Click vào bài cần sửa
3. Click **"Chỉnh sửa"**
4. Cập nhật thông tin:
   - Tiêu đề
   - Abstract
   - File PDF mới (nếu cần)
5. Click **"Lưu thay đổi"**

**Điều kiện chỉnh sửa:**
- ⚠️ Chỉ sửa được trước deadline
- ⚠️ Bài chưa được phân công reviewer
- ⚠️ Trạng thái: SUBMITTED

### 2.4 Rút Bài

1. Vào **"Bài báo của tôi"**
2. Click vào bài cần rút
3. Click **"Rút bài"**
4. Xác nhận rút bài

**Lưu ý:**
- ⚠️ Không thể rút bài đã có reviewer chấp nhận
- ⚠️ Không thể rút bài đã có kết quả (Accept/Reject)

### 2.5 Xem Kết Quả Đánh Giá

1. Vào **"Bài báo của tôi"**
2. Click vào bài đã có kết quả
3. Xem:
   - **Quyết định**: Accept / Reject / Revision
   - **Điểm trung bình**: Từ các reviewer
   - **Nhận xét**: Feedback ẩn danh từ reviewers
   - **Lý do quyết định**: Từ Chair

### 2.6 Nộp Camera-Ready (Bản Cuối)

Sau khi bài được Accept:

1. Vào **"Bài báo của tôi"**
2. Click vào bài đã Accept
3. Click **"Upload Camera-Ready"**
4. Upload file PDF bản cuối (đã chỉnh sửa theo góp ý)
5. Click **"Nộp"**

**Yêu cầu:**
- ✅ Đã chỉnh sửa theo góp ý của reviewers
- ✅ Đúng format của hội nghị
- ✅ Nộp trước deadline camera-ready

### 2.7 Sử Dụng AI Assistant (Tùy chọn)

**Kiểm tra chính tả:**
1. Khi viết Abstract, click **"Kiểm tra chính tả"**
2. Xem gợi ý sửa lỗi
3. Click **"Áp dụng"** hoặc **"Bỏ qua"**

**Cải thiện Abstract:**
1. Click **"Cải thiện Abstract"**
2. AI sẽ đề xuất phiên bản mới
3. Xem so sánh side-by-side
4. Click **"Áp dụng"** nếu đồng ý

**Gợi ý Keywords:**
1. Click **"Gợi ý Keywords"**
2. AI phân tích Abstract và đề xuất từ khóa
3. Chọn keywords phù hợp

---

## 3. Hướng Dẫn Cho Reviewer

### 3.1 Xem Phân Công

1. Vào **"Phân công của tôi"**
2. Xem danh sách bài được phân công:
   - Tiêu đề bài (ẩn danh nếu double-blind)
   - Track
   - Deadline đánh giá
   - Trạng thái

### 3.2 Chấp Nhận/Từ Chối Phân Công

1. Click vào bài được phân công
2. Đọc Abstract và thông tin
3. Chọn:
   - **"Chấp nhận"**: Đồng ý đánh giá
   - **"Từ chối"**: Không thể đánh giá (ghi lý do)

**Lý do từ chối:**
- Conflict of Interest (COI)
- Không đủ chuyên môn
- Bận công việc

### 3.3 Khai Báo COI (Conflict of Interest)

Nếu có xung đột lợi ích với bài báo:

1. Vào **"Khai báo COI"**
2. Chọn bài báo
3. Chọn loại COI:
   - Đồng tác giả trong 3 năm qua
   - Cùng đơn vị
   - Quan hệ cá nhân
   - Khác (ghi rõ)
4. Click **"Khai báo"**

### 3.4 Đánh Giá Bài Báo

1. Vào **"Phân công của tôi"**
2. Click vào bài đã chấp nhận
3. Đọc kỹ bài báo (download PDF)
4. Điền form đánh giá:

**Điểm số (1-5):**
- **5**: Xuất sắc - Chắc chắn Accept
- **4**: Tốt - Nên Accept
- **3**: Trung bình - Có thể Accept với sửa đổi nhỏ
- **2**: Yếu - Cần sửa đổi lớn
- **1**: Rất yếu - Nên Reject

**Các tiêu chí đánh giá:**
- Tính mới (Novelty)
- Phương pháp (Methodology)
- Kết quả (Results)
- Trình bày (Presentation)
- Tài liệu tham khảo (References)

**Nhận xét:**
- **Điểm mạnh**: Những điểm tốt của bài
- **Điểm yếu**: Những vấn đề cần cải thiện
- **Góp ý**: Đề xuất cụ thể để cải thiện
- **Nhận xét riêng cho Chair**: Không hiển thị cho tác giả

5. Click **"Nộp đánh giá"**

**Lưu ý:**
- ✅ Đánh giá khách quan, công bằng
- ✅ Nhận xét mang tính xây dựng
- ✅ Nộp trước deadline
- ⚠️ Không tiết lộ danh tính (nếu double-blind)

### 3.5 Sử Dụng AI Assistant

**Tóm tắt bài báo:**
1. Click **"Tạo tóm tắt"**
2. AI tạo synopsis 150-250 từ
3. Giúp nắm bắt nhanh nội dung

**Trích xuất điểm chính:**
1. Click **"Trích xuất key points"**
2. AI liệt kê:
   - Claims chính
   - Phương pháp
   - Datasets sử dụng
   - Kết quả chính

---

## 4. Hướng Dẫn Cho Chair

### 4.1 Tạo Hội Nghị

1. Vào **"Quản lý hội nghị"** → **"Tạo mới"**
2. Điền thông tin:
   - **Tên hội nghị**: VD: "ICSE 2026"
   - **Mô tả**: Giới thiệu ngắn
   - **Địa điểm**: Thành phố, quốc gia
   - **Ngày bắt đầu**: DD/MM/YYYY
   - **Ngày kết thúc**: DD/MM/YYYY
   - **Deadline nộp bài**: DD/MM/YYYY HH:mm
   - **Deadline camera-ready**: DD/MM/YYYY HH:mm
3. Click **"Tạo hội nghị"**

### 4.2 Quản Lý Tracks

1. Vào hội nghị → **"Tracks"** → **"Thêm Track"**
2. Điền:
   - **Tên Track**: VD: "AI & Machine Learning"
   - **Mô tả**: Phạm vi chủ đề
   - **Từ khóa**: Các keywords liên quan
3. Click **"Thêm"**

### 4.3 Mời Program Committee (PC)

1. Vào **"Program Committee"** → **"Mời thành viên"**
2. Nhập email reviewer
3. Chọn role: Reviewer / PC Member / Track Chair
4. Click **"Gửi lời mời"**
5. Reviewer nhận email và xác nhận

### 4.4 Xem Danh Sách Bài Nộp

1. Vào **"Bài nộp"**
2. Xem danh sách tất cả bài:
   - Tiêu đề
   - Tác giả
   - Track
   - Trạng thái
   - Số reviewer đã phân công
3. Filter theo:
   - Track
   - Trạng thái
   - Có/chưa có reviewer

### 4.5 Phân Công Reviewer

**Cách 1: Phân công thủ công**
1. Vào **"Bài nộp"** → Click vào bài
2. Click **"Phân công reviewer"**
3. Chọn reviewer từ danh sách
4. Hệ thống tự động kiểm tra COI
5. Click **"Phân công"**

**Cách 2: Phân công tự động (AI)**
1. Vào **"Phân công tự động"**
2. Chọn:
   - Số reviewer/bài (thường 3)
   - Phương pháp: Topic matching / Keyword similarity
3. Click **"Phân công"**
4. Xem preview danh sách phân công
5. Điều chỉnh nếu cần
6. Click **"Xác nhận"**

**Lưu ý:**
- ⚠️ Hệ thống tự động chặn COI
- ⚠️ Không phân công cùng đơn vị với tác giả
- ⚠️ Reviewer phải có expertise phù hợp

### 4.6 Theo Dõi Tiến Độ Đánh Giá

1. Vào **"Dashboard"** → **"Tiến độ đánh giá"**
2. Xem:
   - Số bài đã có đủ reviews
   - Số bài đang chờ reviews
   - Reviewer nào chưa nộp
3. Gửi nhắc nhở:
   - Click **"Nhắc nhở"** cho reviewer chậm
   - Hệ thống gửi email tự động

### 4.7 Ra Quyết Định

1. Vào **"Bài nộp"** → Click vào bài đã có đủ reviews
2. Xem:
   - Điểm trung bình
   - Nhận xét từ reviewers
   - Thống kê điểm
3. Chọn quyết định:
   - **Accept**: Chấp nhận
   - **Reject**: Từ chối
   - **Revision**: Yêu cầu sửa đổi
4. Viết lý do quyết định
5. Chọn **"Gửi email thông báo"** (nếu muốn)
6. Click **"Lưu quyết định"**

**Quyết định hàng loạt:**
1. Vào **"Quyết định hàng loạt"**
2. Chọn nhiều bài
3. Chọn quyết định chung
4. Click **"Áp dụng"**

### 4.8 Khóa Hội Nghị

Sau khi hoàn tất tất cả quyết định:

1. Vào **"Cài đặt hội nghị"**
2. Click **"Khóa hội nghị"**
3. Xác nhận

**Khi hội nghị bị khóa:**
- ❌ Không nộp bài mới
- ❌ Không phân công reviewer mới
- ❌ Không nộp review mới
- ❌ Không thay đổi quyết định

### 4.9 Xuất Dữ Liệu

**Xuất danh sách bài Accept:**
1. Vào **"Xuất dữ liệu"** → **"Bài Accept"**
2. Chọn format: CSV / Excel / PDF
3. Click **"Tải xuống"**

**Xuất Proceedings:**
1. Vào **"Xuất Proceedings"**
2. Chọn template
3. Click **"Tạo Proceedings"**
4. Tải file PDF

---

## 5. Hướng Dẫn Cho Admin

### 5.1 Quản Lý Người Dùng

**Xem danh sách users:**
1. Vào **"Quản trị"** → **"Người dùng"**
2. Xem danh sách tất cả users:
   - Email
   - Họ tên
   - Roles
   - Trạng thái (Active/Disabled)
   - Ngày đăng ký

**Tìm kiếm user:**
1. Nhập email hoặc tên vào ô tìm kiếm
2. Filter theo role hoặc trạng thái

**Chỉnh sửa user:**
1. Click vào user
2. Có thể:
   - Đổi họ tên
   - Thêm/xóa roles
   - Bật/tắt tài khoản
   - Xem lịch sử hoạt động
3. Click **"Lưu"**

**Xóa user:**
1. Click vào user
2. Click **"Xóa tài khoản"**
3. Xác nhận

**Lưu ý:**
- ⚠️ Xóa user sẽ xóa tất cả dữ liệu liên quan
- ⚠️ Không thể khôi phục sau khi xóa

### 5.2 Quản Lý Roles

**Các roles mặc định:**
- **ROLE_AUTHOR**: Tác giả (mặc định khi đăng ký)
- **ROLE_REVIEWER**: Người đánh giá
- **ROLE_CHAIR**: Chủ tịch hội nghị
- **ROLE_ADMIN**: Quản trị viên hệ thống

**Gán role cho user:**
1. Vào user → **"Roles"**
2. Chọn role muốn thêm
3. Click **"Thêm role"**

**Xóa role:**
1. Click **"X"** bên cạnh role
2. Xác nhận

### 5.3 Xem Thống Kê Hệ Thống

1. Vào **"Dashboard Admin"**
2. Xem:
   - Tổng số users
   - Tổng số hội nghị
   - Tổng số bài nộp
   - Tổng số reviews
   - Biểu đồ hoạt động theo thời gian

### 5.4 Xem Audit Logs

1. Vào **"Audit Logs"**
2. Xem lịch sử hoạt động:
   - User đăng nhập
   - Tạo/sửa/xóa dữ liệu
   - Thay đổi roles
   - Sử dụng AI features
3. Filter theo:
   - User
   - Hành động
   - Thời gian

### 5.5 Cấu Hình Hệ Thống

**Email Settings:**
1. Vào **"Cài đặt"** → **"Email"**
2. Cấu hình:
   - SMTP host
   - Port
   - Username/Password
   - Email gửi đi (From)
3. Click **"Test email"** để kiểm tra
4. Click **"Lưu"**

**AI Settings:**
1. Vào **"Cài đặt"** → **"AI"**
2. Bật/tắt từng tính năng:
   - Spell check
   - Abstract improvement
   - Synopsis generation
   - Reviewer matching
3. Cấu hình API key
4. Click **"Lưu"**

---

## 6. Câu Hỏi Thường Gặp (FAQ)

### Q1: Tôi quên mật khẩu, làm sao để reset?
**A:** Click "Quên mật khẩu?" trên trang đăng nhập, nhập email, nhận OTP qua email và đặt lại mật khẩu mới.

### Q2: Tôi có thể nộp bài vào nhiều track không?
**A:** Không. Mỗi bài chỉ được nộp vào 1 track duy nhất.

### Q3: Deadline đã qua nhưng tôi chưa nộp được, làm sao?
**A:** Liên hệ Chair của hội nghị để xin gia hạn. Hệ thống tự động chặn nộp bài sau deadline.

### Q4: Tôi có thể xem ai là reviewer của bài mình không?
**A:** Không. Hệ thống ẩn danh reviewer để đảm bảo công bằng.

### Q5: Làm sao để trở thành Reviewer?
**A:** Chair sẽ mời bạn qua email. Bạn cũng có thể liên hệ Chair để đề nghị tham gia PC.

### Q6: Tôi có thể rút lại đánh giá đã nộp không?
**A:** Không. Sau khi nộp, chỉ Chair mới có thể xem và sử dụng đánh giá.

### Q7: AI có tự động sửa bài của tôi không?
**A:** Không. AI chỉ đề xuất, bạn phải xem xét và click "Áp dụng" thì mới thay đổi.

### Q8: Dữ liệu của tôi có được bảo mật không?
**A:** Có. Hệ thống sử dụng HTTPS, mã hóa mật khẩu, và tuân thủ RBAC nghiêm ngặt.

---

## 7. Liên Hệ Hỗ Trợ

Nếu gặp vấn đề kỹ thuật:

- **Email**: support@uthconfms.edu.vn
- **Hotline**: 1900-xxxx-xxx
- **Giờ làm việc**: 8:00 - 17:00 (Thứ 2 - Thứ 6)

---

## Tài Liệu Liên Quan

- [Hướng Dẫn Cài Đặt](huong-dan-cai-dat.md)
- [Tài Liệu Kiểm Thử](tai-lieu-kiem-thu.md)
- [Triển Khai Hệ Thống](trien-khai-he-thong.md)
- [API Documentation](http://localhost:8080/swagger-ui.html)

---

**Phiên Bản Tài Liệu**: 1.0  
**Cập Nhật Lần Cuối**: Tháng 01/2026  
**Người Soạn**: Nhóm Phát Triển
