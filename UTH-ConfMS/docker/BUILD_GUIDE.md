# UTH-ConfMS Docker Build Guide

## 📋 Chuẩn bị trước khi build

### 1. Cấu hình Environment Variables

Tạo file `.env` trong thư mục `docker/` từ các file example:

```bash
cd docker

# Copy và chỉnh sửa backend env
cp backend.env.example backend.env

# Copy và chỉnh sửa ai-service env
cp ai-service.env.example ai-service.env

# Copy và chỉnh sửa frontend env
cp frontend.env.example frontend.env
```

### 2. Cập nhật các giá trị quan trọng

**Backend (.env hoặc docker-compose.yml):**
- `JWT_SECRET`: Secret key cho JWT (tối thiểu 32 ký tự)
- `MAIL_PASSWORD`: App password của Gmail
- `SPRING_DATASOURCE_PASSWORD`: Password cho PostgreSQL

**AI Service:**
- `OPENAI_API_KEY`: API key của OpenAI (bắt buộc)
- `ANTHROPIC_API_KEY`: API key của Anthropic (tùy chọn)

**Frontend:**
- `VITE_FIREBASE_*`: Các thông tin Firebase config

### 3. Kiểm tra Firebase Service Account

Đảm bảo file `backend/uth-confms-firebase-sa.json/uth-confms-firebase-sa.json` tồn tại và có nội dung hợp lệ.

## 🚀 Build Commands

### Build toàn bộ hệ thống

```bash
cd docker
docker-compose build
```

### Build từng service riêng lẻ

**Backend:**
```bash
cd backend
docker build -t uth-confms-backend .
```

**Frontend:**
```bash
cd frontend
docker build -t uth-confms-frontend .
```

**AI Service:**
```bash
cd ai-service
docker build -t uth-confms-ai .
```

## ▶️ Run Commands

### Khởi động toàn bộ hệ thống

```bash
cd docker
docker-compose up -d
```

### Khởi động và build lại

```bash
cd docker
docker-compose up -d --build
```

### Xem logs

```bash
# Tất cả services
docker-compose logs -f

# Một service cụ thể
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f ai-service
```

### Dừng hệ thống

```bash
cd docker
docker-compose down
```

### Dừng và xóa volumes

```bash
cd docker
docker-compose down -v
```

## 🔍 Kiểm tra hệ thống

### Health Checks

- **Backend:** http://localhost:8080/actuator/health (nếu có actuator)
- **Frontend:** http://localhost:3000/
- **AI Service:** http://localhost:8001/health
- **PostgreSQL:** Port 5435
- **Redis:** Port 6379

### Access URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8080/api
- **AI Service API:** http://localhost:8001/api/v1

## 📦 Services Overview

| Service | Container | Port | Dependencies |
|---------|-----------|------|--------------|
| PostgreSQL | uth_db | 5435:5432 | - |
| Redis | uth_redis | 6379:6379 | - |
| Backend | uth_backend | 8080:8080 | postgres, redis |
| AI Service | uth_ai | 8001:8000 | postgres, redis |
| Frontend | uth_frontend | 3000:80 | backend |

## 🐛 Troubleshooting

### Backend không kết nối được database

```bash
# Kiểm tra postgres đã chạy chưa
docker-compose ps postgres

# Kiểm tra logs của postgres
docker-compose logs postgres

# Restart backend
docker-compose restart backend
```

### Frontend không gọi được API

- Kiểm tra CORS trong backend có bao gồm `http://localhost:3000`
- Kiểm tra nginx.conf proxy đúng chưa
- Kiểm tra backend đã chạy chưa

### AI Service lỗi API key

```bash
# Kiểm tra environment variables
docker-compose exec ai-service env | grep API_KEY

# Restart với env mới
docker-compose up -d --force-recreate ai-service
```

## 🔒 Security Notes

1. **KHÔNG commit các file:**
   - `.env`
   - `backend.env`
   - `ai-service.env`
   - `frontend.env`
   - Firebase service account JSON

2. **Đổi các giá trị mặc định:**
   - Database password
   - JWT secret
   - API keys

3. **Production deployment:**
   - Sử dụng secrets management
   - Enable HTTPS
   - Cấu hình firewall rules
   - Regular security updates

## 📝 Development vs Production

### Development (hiện tại)
- Sử dụng docker-compose.yml
- Ports expose ra localhost
- Debug mode enabled
- Hot reload (nếu có)

### Production (cần thêm)
- Sử dụng docker-compose.prod.yml
- HTTPS với SSL certificates
- Environment-specific configs
- Load balancing
- Monitoring & logging
- Backup strategies

## 🆘 Support

Nếu gặp vấn đề, kiểm tra:
1. Logs của các services
2. Network connectivity giữa containers
3. Environment variables
4. File permissions
5. Disk space

Liên hệ team để được hỗ trợ!
