# Tài Liệu Yêu Cầu Người Dùng (User Requirements Document)

## Thông Tin Tài Liệu

| Thông tin     | Chi tiết                                        |
| ------------- | ----------------------------------------------- |
| **Dự án**     | UTH-ConfMS (Hệ thống quản lý hội nghị khoa học) |
| **Phiên bản** | 1.0                                             |
| **Ngày tạo**  | Tháng 01/2026                                   |
| **Tác giả**   | Nhóm phát triển UTH                             |

---

## 1. Giới Thiệu

### 1.1 Mục Đích

Tài liệu này mô tả các yêu cầu từ góc nhìn người dùng cho Hệ thống Quản lý Hội nghị Khoa học UTH (UTH-ConfMS). Hệ thống cung cấp một nền tảng toàn diện để quản lý quy trình hội nghị khoa học từ đầu đến cuối, bao gồm: Call for Papers, Submission, Review, Decision, Camera-ready và Proceedings.

### 1.2 Phạm Vi

Hệ thống UTH-ConfMS sẽ thay thế các công cụ và dịch vụ rời rạc hiện đang được sử dụng bởi các Khoa tại Trường Đại học UTH cho việc tổ chức hội nghị nghiên cứu khoa học.

### 1.3 Đối Tượng Đọc

- Nhà quản lý dự án
- Nhóm phát triển
- Người dùng cuối (tác giả, reviewer, chair)
- Quản trị viên hệ thống

---

## 2. Các Bên Liên Quan (Stakeholders)

### 2.1 Tác Giả (Author)

- Nhà nghiên cứu, giảng viên, sinh viên
- Nộp bài báo khoa học
- Theo dõi trạng thái bài nộp
- Nhận phản hồi từ reviewer

### 2.2 Người Đánh Giá (Reviewer / PC Member)

- Chuyên gia trong lĩnh vực nghiên cứu
- Đánh giá các bài báo được phân công
- Tham gia thảo luận nội bộ PC

### 2.3 Chủ Tịch Hội Nghị (Program/Track Chair)

- Người tổ chức hội nghị
- Quản lý toàn bộ quy trình hội nghị
- Ra quyết định Accept/Reject
- Quản lý PC members

### 2.4 Quản Trị Viên Hệ Thống (Administrator)

- Quản lý nền tảng
- Cấu hình hệ thống
- Quản lý người dùng và phân quyền

---

## 3. Yêu Cầu Chức Năng

### 3.1 Quản Lý Người Dùng

| ID     | Yêu cầu               | Mô tả                                                           | Độ ưu tiên |
| ------ | --------------------- | --------------------------------------------------------------- | ---------- |
| UR-001 | Đăng ký tài khoản     | Người dùng có thể đăng ký tài khoản mới với email và mật khẩu   | Cao        |
| UR-002 | Đăng nhập             | Người dùng có thể đăng nhập bằng email/mật khẩu hoặc Google SSO | Cao        |
| UR-003 | Quên mật khẩu         | Người dùng có thể khôi phục mật khẩu qua OTP email              | Cao        |
| UR-004 | Quản lý hồ sơ         | Người dùng có thể cập nhật thông tin cá nhân, avatar            | Trung bình |
| UR-005 | Xem lịch sử hoạt động | Người dùng có thể xem các hoạt động đã thực hiện                | Thấp       |

### 3.2 Quản Lý Hội Nghị

| ID     | Yêu cầu             | Mô tả                                              | Độ ưu tiên |
| ------ | ------------------- | -------------------------------------------------- | ---------- |
| UR-010 | Tạo hội nghị        | Chair có thể tạo hội nghị mới với thông tin cơ bản | Cao        |
| UR-011 | Cấu hình Tracks     | Chair có thể tạo/sửa/xóa các track của hội nghị    | Cao        |
| UR-012 | Thiết lập Deadlines | Chair có thể đặt các mốc thời gian quan trọng      | Cao        |
| UR-013 | Công bố CFP         | Chair có thể công bố Call for Papers               | Cao        |
| UR-014 | Chế độ Blind Review | Hỗ trợ single-blind và double-blind review         | Trung bình |

### 3.3 Nộp Bài Báo (Paper Submission)

| ID     | Yêu cầu           | Mô tả                                                | Độ ưu tiên |
| ------ | ----------------- | ---------------------------------------------------- | ---------- |
| UR-020 | Nộp bài mới       | Tác giả có thể nộp bài báo với metadata và file PDF  | Cao        |
| UR-021 | Thêm đồng tác giả | Tác giả có thể thêm thông tin đồng tác giả           | Cao        |
| UR-022 | Chỉnh sửa bài     | Tác giả có thể chỉnh sửa bài trước deadline          | Cao        |
| UR-023 | Rút bài           | Tác giả có thể rút bài đã nộp                        | Trung bình |
| UR-024 | Kiểm tra AI       | Tác giả có thể sử dụng AI kiểm tra chính tả/ngữ pháp | Thấp       |

### 3.4 Quy Trình Đánh Giá (Review Process)

| ID     | Yêu cầu            | Mô tả                                        | Độ ưu tiên |
| ------ | ------------------ | -------------------------------------------- | ---------- |
| UR-030 | Mời PC Members     | Chair có thể mời reviewer tham gia PC        | Cao        |
| UR-031 | Phân công Reviewer | Chair có thể phân công reviewer cho từng bài | Cao        |
| UR-032 | Kiểm tra COI       | Hệ thống kiểm tra xung đột lợi ích           | Cao        |
| UR-033 | Nộp đánh giá       | Reviewer có thể nộp điểm số và nhận xét      | Cao        |
| UR-034 | Thảo luận PC       | Reviewer có thể thảo luận nội bộ về bài báo  | Trung bình |
| UR-035 | AI Synopsis        | Reviewer có thể xem tóm tắt AI cho bidding   | Thấp       |

### 3.5 Ra Quyết Định (Decision Making)

| ID     | Yêu cầu           | Mô tả                                        | Độ ưu tiên |
| ------ | ----------------- | -------------------------------------------- | ---------- |
| UR-040 | Tổng hợp đánh giá | Chair có thể xem tổng hợp điểm các bài       | Cao        |
| UR-041 | Ra quyết định     | Chair có thể đánh dấu Accept/Reject          | Cao        |
| UR-042 | Gửi thông báo     | Chair có thể gửi email thông báo hàng loạt   | Cao        |
| UR-043 | AI Email Draft    | Chair có thể sử dụng AI soạn email thông báo | Thấp       |

### 3.6 Camera-ready và Proceedings

| ID     | Yêu cầu              | Mô tả                                        | Độ ưu tiên |
| ------ | -------------------- | -------------------------------------------- | ---------- |
| UR-050 | Mở vòng Camera-ready | Chair mở vòng nộp bản final                  | Cao        |
| UR-051 | Nộp Camera-ready     | Tác giả nộp bản final của bài được chấp nhận | Cao        |
| UR-052 | Xuất Proceedings     | Chair xuất dữ liệu cho proceedings           | Trung bình |
| UR-053 | Công bố Program      | Chair công bố lịch trình hội nghị            | Trung bình |

### 3.7 Báo Cáo và Thống Kê

| ID     | Yêu cầu          | Mô tả                                        | Độ ưu tiên |
| ------ | ---------------- | -------------------------------------------- | ---------- |
| UR-060 | Thống kê bài nộp | Xem số liệu thống kê bài nộp theo track/khoa | Trung bình |
| UR-061 | Tỷ lệ chấp nhận  | Xem tỷ lệ acceptance rate                    | Trung bình |
| UR-062 | Tiến độ review   | Theo dõi tiến độ đánh giá theo SLA           | Trung bình |
| UR-063 | Audit Logs       | Xem nhật ký hoạt động hệ thống               | Cao        |

---

## 4. Yêu Cầu Phi Chức Năng

### 4.1 Hiệu Năng (Performance)

| ID      | Yêu cầu             | Mô tả                                     |
| ------- | ------------------- | ----------------------------------------- |
| NFR-001 | Thời gian phản hồi  | Trang web phải tải trong vòng 3 giây      |
| NFR-002 | Đồng thời           | Hỗ trợ hàng trăm người dùng đồng thời     |
| NFR-003 | Xử lý deadline peak | Hệ thống ổn định khi gần deadline nộp bài |

### 4.2 Bảo Mật (Security)

| ID      | Yêu cầu         | Mô tả                                     |
| ------- | --------------- | ----------------------------------------- |
| NFR-010 | HTTPS           | Mọi kết nối phải qua HTTPS                |
| NFR-011 | Mã hóa mật khẩu | Mật khẩu phải được hash bằng BCrypt       |
| NFR-012 | Phân quyền RBAC | Kiểm soát truy cập dựa trên vai trò       |
| NFR-013 | Blind Review    | Ẩn danh tác giả trong chế độ double-blind |
| NFR-014 | COI Enforcement | Ngăn chặn reviewer có xung đột lợi ích    |
| NFR-015 | Audit Trail     | Ghi lại mọi hành động quan trọng          |

### 4.3 Khả Dụng (Usability)

| ID      | Yêu cầu              | Mô tả                                  |
| ------- | -------------------- | -------------------------------------- |
| NFR-020 | Giao diện thân thiện | UI dễ sử dụng, không cần đào tạo       |
| NFR-021 | Đa ngôn ngữ          | Hỗ trợ tiếng Việt và tiếng Anh         |
| NFR-022 | Email tùy chỉnh      | Cho phép tùy chỉnh mẫu email thông báo |
| NFR-023 | Unicode              | Hỗ trợ đầy đủ ký tự Unicode            |

### 4.4 Độ Tin Cậy (Reliability)

| ID      | Yêu cầu  | Mô tả                                  |
| ------- | -------- | -------------------------------------- |
| NFR-030 | Uptime   | Đảm bảo 99.5% thời gian hoạt động      |
| NFR-031 | Backup   | Sao lưu dữ liệu tự động hàng ngày      |
| NFR-032 | Recovery | Khả năng khôi phục dữ liệu trong 1 giờ |

### 4.5 AI Governance

| ID      | Yêu cầu           | Mô tả                                               |
| ------- | ----------------- | --------------------------------------------------- |
| NFR-040 | Human-in-the-loop | Mọi gợi ý AI cần xác nhận của người dùng            |
| NFR-041 | Feature Flags     | Bật/tắt tính năng AI theo từng hội nghị             |
| NFR-042 | AI Audit          | Ghi lại mọi yêu cầu AI với prompt, model, timestamp |
| NFR-043 | Data Privacy      | Không train trên dữ liệu hội nghị (trừ khi opt-in)  |

---

## 5. Ràng Buộc và Giả Định

### 5.1 Ràng Buộc

- Hệ thống phải tương thích với các trình duyệt phổ biến (Chrome, Firefox, Safari, Edge)
- Backend sử dụng Java/Spring Boot theo yêu cầu học phần
- Frontend sử dụng ReactJS
- Database sử dụng PostgreSQL

### 5.2 Giả Định

- Người dùng có kết nối Internet ổn định
- Người dùng có email hợp lệ để đăng ký
- File PDF nộp bài không vượt quá 50MB

---

## 6. Tiêu Chí Chấp Nhận

| ID     | Tiêu chí                                                 |
| ------ | -------------------------------------------------------- |
| AC-001 | Tác giả có thể nộp bài thành công và nhận email xác nhận |
| AC-002 | Reviewer có thể xem và đánh giá bài được phân công       |
| AC-003 | Chair có thể phân công reviewer và ra quyết định         |
| AC-004 | Hệ thống ngăn chặn truy cập trái phép                    |
| AC-005 | Dữ liệu được sao lưu tự động và có thể khôi phục         |

---

## Tài Liệu Liên Quan

- [Đặc tả Yêu cầu Phần mềm (SRS)](srs.md)
- [Kiến trúc Hệ thống](architecture.md)
- [Sơ đồ UML](uml-diagrams.md)
