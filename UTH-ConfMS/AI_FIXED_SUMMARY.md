# ✅ ĐÃ FIX XONG CHỨC NĂNG AI

## Vấn đề đã fix:
1. ✅ Cập nhật API key mới: `AIzaSyBXojwdp_zgMfoi6eiVEEgUycUuLY0i31I`
2. ✅ Nâng cấp model từ `gemini-1.5-flash` → `gemini-2.5-flash` (model mới nhất)
3. ✅ Thêm `conferenceId` vào tất cả request AI từ frontend
4. ✅ Thêm log debug để dễ troubleshoot
5. ✅ Test key thành công với Gemini API

## Files đã sửa:
- `backend/.env` - Cập nhật GEMINI_API_KEY
- `ai-service/.env` - Cập nhật GEMINI_API_KEY
- `backend/src/main/resources/application.properties` - Đổi URL sang gemini-2.5-flash
- `backend/src/main/java/edu/uth/backend/ai/AIProxyService.java` - Đổi modelId và thêm log
- `frontend/src/pages/author/AuthorNewSubmissionPage.jsx` - Thêm conferenceId vào request

## Bước tiếp theo - QUAN TRỌNG:
**BẠN PHẢI RESTART BACKEND ĐỂ LOAD CẤU HÌNH MỚI!**

### Cách restart:
1. **Nếu dùng IDE (IntelliJ/Eclipse/VS Code)**:
   - Nhấn nút Stop (hình vuông đỏ)
   - Nhấn nút Run/Start lại

2. **Nếu chạy bằng Maven**:
   - Nhấn Ctrl+C trong terminal đang chạy backend
   - Chạy lại: `cd backend && mvn spring-boot:run`

3. **Nếu dùng Docker**:
   - `docker-compose restart backend`

## Test sau khi restart:
1. Vào trang nộp bài: http://localhost:5173/author/submissions/new
2. Chọn hội nghị
3. Nhập tiêu đề: "Machine Learning for Healthcare"
4. Nhập tóm tắt: "This paper present a new method..."
5. Nhấn nút **"Kiểm tra ngữ pháp"** hoặc **"Gợi ý từ khóa"**
6. Nếu thành công → Chức năng AI đã hoạt động! ✓

## Các chức năng AI có sẵn:
### Author (Tác giả):
- ✅ Kiểm tra ngữ pháp (Grammar Check)
- ✅ Cải thiện văn bản (Polish Content)
- ✅ Gợi ý từ khóa (Keyword Suggestion)

### Reviewer (Người chấm):
- ✅ Tạo tóm tắt bài báo (Paper Synopsis)

### Chair (Chủ tịch):
- ✅ Tính độ tương đồng reviewer (Reviewer Similarity)
- ✅ Gợi ý phân công (Assignment Suggestion)
- ✅ Soạn thảo email (Email Draft)

## Lưu ý:
- API key miễn phí có giới hạn: 15 requests/phút, 1500 requests/ngày
- Nếu vượt giới hạn, sẽ nhận lỗi 429 (Too Many Requests)
- Key không hết hạn trừ khi bạn xóa nó trong Google AI Studio
- KHÔNG share key này công khai trên GitHub!
