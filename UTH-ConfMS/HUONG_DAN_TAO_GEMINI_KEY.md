# Hướng dẫn tạo Google Gemini API Key

## Bước 1: Truy cập Google AI Studio

1. Mở trình duyệt và truy cập: https://aistudio.google.com/app/apikey
2. Đăng nhập bằng tài khoản Google của bạn

## Bước 2: Tạo API Key mới

1. Nhấn nút **"Create API Key"** hoặc **"Get API Key"**
2. Chọn một trong hai tùy chọn:
   - **Create API key in new project** (Tạo key trong project mới - Khuyến nghị)
   - **Create API key in existing project** (Tạo key trong project có sẵn)
3. Nhấn **"Create API key"**

## Bước 3: Copy API Key

1. Sau khi tạo xong, một cửa sổ hiện lên với API key
2. **QUAN TRỌNG**: Copy toàn bộ key (dạng: AIzaSy...)
3. Lưu key này vào file text tạm thời (KHÔNG share cho ai)

## Bước 4: Cập nhật vào hệ thống

1. Mở file `UTH-ConfMS/backend/.env`
2. Tìm dòng: `GEMINI_API_KEY=...`
3. Thay thế bằng key mới vừa copy
4. Lưu file

5. Mở file `UTH-ConfMS/ai-service/.env`
6. Tìm dòng: `GEMINI_API_KEY=...`
7. Thay thế bằng key mới (cùng key)
8. Lưu file

9. Mở file `UTH-ConFMS/docker/.env`
10. Tìm dòng: `GEMINI_API_KEY=...`
11. Thay thế bằng key mới (cùng key)

## Bước 5: Restart Backend

- Nếu dùng IDE: Stop và Start lại ứng dụng
- Nếu dùng Maven: Ctrl+C rồi chạy lại `mvn spring-boot:run`
- Nếu dùng Docker: `docker-compose restart backend`

## Lưu ý quan trọng

- API key là MIỄN PHÍ cho Gemini 1.5 Flash (có giới hạn request/phút)
- KHÔNG share key này công khai trên GitHub
- Nếu key bị lộ, hãy xóa và tạo key mới
- Key không có thời hạn hết hạn trừ khi bạn xóa nó

## Kiểm tra key có hoạt động không

Sau khi cập nhật key và restart backend:

1. Vào trang nộp bài (Author)
2. Nhập tiêu đề hoặc tóm tắt
3. Nhấn nút "Kiểm tra ngữ pháp" hoặc "Gợi ý từ khóa"
4. Nếu thành công → Key hoạt động ✓
5. Nếu vẫn lỗi → Kiểm tra log backend để xem lỗi chi tiết
