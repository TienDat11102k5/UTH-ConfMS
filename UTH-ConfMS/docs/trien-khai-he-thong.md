# Triển Khai Hệ Thống - UTH-ConfMS

## Thông Tin Tài Liệu

| Trường        | Giá trị                                             |
| ------------- | --------------------------------------------------- |
| **Dự án**     | Hệ thống Quản lý Hội nghị Khoa học UTH (UTH-ConfMS) |
| **Phiên bản** | 1.0                                                 |
| **Ngày tạo**  | Tháng 01/2026                                       |
| **Đối tượng** | DevOps, System Administrator                        |

---

## 1. Tổng Quan Triển Khai

### 1.1 Kiến Trúc Triển Khai

```
┌─────────────────────────────────────────────────────────┐
│                    Internet / Users                      │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────┐
         │   Nginx Reverse Proxy   │
         │   (SSL/TLS Termination) │
         └────────┬────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
┌──────────────┐    ┌──────────────┐
│   Frontend   │    │   Backend    │
│   (React)    │    │ (Spring Boot)│
│   Port 3000  │    │   Port 8080  │
└──────────────┘    └───────┬──────┘
                            │
                    ┌───────┴────────┐
                    │                │
                    ▼                ▼
            ┌──────────────┐  ┌──────────────┐
            │  PostgreSQL  │  │  AI Service  │
            │   Port 5432  │  │  (FastAPI)   │
            └──────────────┘  │   Port 8000  │
                              └───────┬──────┘
                                      │
                              ┌───────▼──────┐
                              │    Redis     │
                              │  Port 6379   │
                              └──────────────┘
```

### 1.2 Các Thành Phần

| Thành phần        | Công nghệ         | Port   | Mô tả                    |
| ----------------- | ----------------- | ------ | ------------------------ |
| **Frontend**      | React 19 + Vite 7 | 3000   | Giao diện người dùng     |
| **Backend**       | Spring Boot 3.5.9 | 8080   | REST API, Business Logic |
| **AI Service**    | Python FastAPI    | 8000   | AI features (Gemini)     |
| **Database**      | PostgreSQL 16     | 5432   | Lưu trữ dữ liệu          |
| **Cache**         | Redis 7           | 6379   | Session, Cache           |
| **Reverse Proxy** | Nginx             | 80/443 | Load balancer, SSL       |

---

## 2. Môi Trường Triển Khai

### 2.1 Development (Local)

**Mục đích**: Phát triển và test trên máy local

**Cấu hình:**

- Docker Compose với hot-reload
- H2 database (in-memory) cho tests
- Mock external services
- Debug logging enabled

**Khởi động:**

```bash
cd docker
docker-compose -f docker-compose.dev.yml up -d
```

### 2.2 Staging (Test Server)

**Mục đích**: Test trước khi lên production

**Cấu hình:**

- Giống production nhưng dữ liệu test
- Có thể reset database
- Logging level: DEBUG

**Khởi động:**

```bash
cd docker
docker-compose -f docker-compose.staging.yml up -d
```

### 2.3 Production (Live Server)

**Mục đích**: Phục vụ người dùng thực

**Cấu hình:**

- SSL/TLS bắt buộc
- Database backup tự động
- Monitoring & alerting
- Logging level: WARN/ERROR
- Rate limiting enabled

**Khởi động:**

```bash
cd docker
docker-compose -f docker-compose.prod.yml up -d
```

---

## 3. Triển Khai Production

### 3.1 Yêu Cầu Server

**Minimum:**

- CPU: 4 cores @ 2.5 GHz
- RAM: 8 GB
- Disk: 100 GB SSD
- Network: 100 Mbps
- OS: Ubuntu 20.04 LTS

**Recommended:**

- CPU: 8 cores @ 3.0 GHz
- RAM: 16 GB
- Disk: 200 GB SSD (RAID 1)
- Network: 1 Gbps
- OS: Ubuntu 22.04 LTS

### 3.2 Chuẩn Bị Server

```bash
# Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# Cài đặt Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Cài đặt Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Cài đặt Nginx
sudo apt install nginx -y

# Cài đặt Certbot (SSL)
sudo apt install certbot python3-certbot-nginx -y

# Cấu hình firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 3.3 Clone và Cấu Hình

```bash
# Clone repository
git clone https://github.com/your-org/UTH-ConfMS.git
cd UTH-ConfMS

# Tạo thư mục cho production
mkdir -p /opt/uth-confms
cp -r * /opt/uth-confms/
cd /opt/uth-confms

# Cấu hình môi trường
cd docker
cp .env.production .env

# Chỉnh sửa .env
nano .env
```

**File .env Production:**

```properties
# ============================================
# BẢO MẬT (QUAN TRỌNG!)
# ============================================
JWT_SECRET=<tạo bằng: openssl rand -base64 64>
POSTGRES_PASSWORD=<mật khẩu mạnh>

# ============================================
# DOMAIN & SSL
# ============================================
DOMAIN=confms.yourdomain.com
APP_BASE_URL=https://confms.yourdomain.com
CORS_ALLOWED_ORIGINS=https://confms.yourdomain.com

# ============================================
# DATABASE
# ============================================
POSTGRES_DB=confms_prod
POSTGRES_USER=confms_user
POSTGRES_PASSWORD=<mật khẩu database>
POSTGRES_PORT=5432

# ============================================
# EMAIL
# ============================================
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=noreply@yourdomain.com
MAIL_PASSWORD=<app password>
MAIL_FROM=noreply@yourdomain.com

# ============================================
# AI SERVICE
# ============================================
GEMINI_API_KEY=<production API key>
AI_PROVIDER=gemini
MODEL_NAME=gemini-1.5-flash

# ============================================
# FIREBASE
# ============================================
FIREBASE_PROJECT_ID=<production project>
FIREBASE_API_KEY=<production API key>

# ============================================
# LOGGING
# ============================================
LOGGING_LEVEL_ROOT=WARN
LOGGING_LEVEL_EDU_UTH=INFO

# ============================================
# PERFORMANCE
# ============================================
SPRING_JPA_HIBERNATE_DDL_AUTO=validate
SPRING_JPA_SHOW_SQL=false
SPRING_JPA_PROPERTIES_HIBERNATE_JDBC_BATCH_SIZE=20
```

### 3.4 Cấu Hình SSL với Let's Encrypt

```bash
# Lấy SSL certificate
sudo certbot --nginx -d confms.yourdomain.com

# Certbot sẽ tự động cấu hình Nginx
# Certificate sẽ tự động renew
```

### 3.5 Cấu Hình Nginx

**File: `/etc/nginx/sites-available/uth-confms`**

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name confms.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name confms.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/confms.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/confms.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # File upload size
        client_max_body_size 100M;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # AI Service
    location /ai {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files (uploads)
    location /uploads {
        alias /opt/uth-confms/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Logs
    access_log /var/log/nginx/uth-confms-access.log;
    error_log /var/log/nginx/uth-confms-error.log;
}
```

**Kích hoạt cấu hình:**

```bash
sudo ln -s /etc/nginx/sites-available/uth-confms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3.6 Khởi Động Production

```bash
cd /opt/uth-confms/docker

# Build images
docker-compose -f docker-compose.prod.yml build

# Khởi động services
docker-compose -f docker-compose.prod.yml up -d

# Kiểm tra logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 3.7 Khởi Tạo Database

```bash
# Kết nối database
docker exec -it uth_db_prod psql -U confms_user -d confms_prod

# Chạy migration scripts
\i /docker-entrypoint-initdb.d/init.sql

# Tạo admin user đầu tiên
INSERT INTO roles (name) VALUES ('ROLE_ADMIN') ON CONFLICT DO NOTHING;
-- (Sau đó đăng ký user qua UI và gán role ADMIN)

\q
```

---

## 4. Backup và Recovery

### 4.1 Backup Database

**Script tự động** (`/opt/uth-confms/scripts/backup-db.sh`):

```bash
#!/bin/bash
BACKUP_DIR="/opt/uth-confms/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="confms_backup_$DATE.sql"

# Tạo thư mục backup
mkdir -p $BACKUP_DIR

# Backup database
docker exec uth_db_prod pg_dump -U confms_user confms_prod > $BACKUP_DIR/$FILENAME

# Nén file
gzip $BACKUP_DIR/$FILENAME

# Xóa backup cũ hơn 30 ngày
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $FILENAME.gz"
```

**Lên lịch backup hàng ngày:**

```bash
# Thêm vào crontab
crontab -e

# Backup lúc 2h sáng mỗi ngày
0 2 * * * /opt/uth-confms/scripts/backup-db.sh >> /var/log/uth-confms-backup.log 2>&1
```

### 4.2 Restore Database

```bash
# Giải nén backup
gunzip /opt/uth-confms/backups/confms_backup_20260120_020000.sql.gz

# Restore
docker exec -i uth_db_prod psql -U confms_user confms_prod < /opt/uth-confms/backups/confms_backup_20260120_020000.sql
```

### 4.3 Backup Files (Uploads)

```bash
#!/bin/bash
UPLOAD_DIR="/opt/uth-confms/uploads"
BACKUP_DIR="/opt/uth-confms/backups/uploads"
DATE=$(date +%Y%m%d)

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz $UPLOAD_DIR

# Xóa backup cũ hơn 30 ngày
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

---

## 5. Monitoring và Logging

### 5.1 Xem Logs

```bash
# Backend logs
docker-compose logs -f uth_backend

# Frontend logs
docker-compose logs -f uth_frontend

# AI Service logs
docker-compose logs -f uth_ai

# Database logs
docker-compose logs -f uth_db

# Tất cả logs
docker-compose logs -f
```

### 5.2 Monitoring với Prometheus + Grafana

**File: `docker-compose.monitoring.yml`**

```yaml
version: "3.8"

services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    volumes:
      - grafana_data:/var/lib/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:
```

**Prometheus config** (`prometheus.yml`):

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: "uth-backend"
    static_configs:
      - targets: ["localhost:8080"]
    metrics_path: "/actuator/prometheus"
```

### 5.3 Health Checks

**Script kiểm tra** (`/opt/uth-confms/scripts/health-check.sh`):

```bash
#!/bin/bash

# Kiểm tra Backend
if curl -f http://localhost:8080/api/health > /dev/null 2>&1; then
    echo "✅ Backend: OK"
else
    echo "❌ Backend: DOWN"
    # Gửi alert (email, Slack, etc.)
fi

# Kiểm tra Frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend: OK"
else
    echo "❌ Frontend: DOWN"
fi

# Kiểm tra AI Service
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ AI Service: OK"
else
    echo "❌ AI Service: DOWN"
fi

# Kiểm tra Database
if docker exec uth_db_prod pg_isready -U confms_user > /dev/null 2>&1; then
    echo "✅ Database: OK"
else
    echo "❌ Database: DOWN"
fi
```

**Chạy mỗi 5 phút:**

```bash
crontab -e

# Health check
*/5 * * * * /opt/uth-confms/scripts/health-check.sh >> /var/log/uth-confms-health.log 2>&1
```

---

## 6. Bảo Trì

### 6.1 Cập Nhật Hệ Thống

```bash
cd /opt/uth-confms

# Pull code mới
git pull origin main

# Rebuild images
cd docker
docker-compose -f docker-compose.prod.yml build

# Restart services (zero-downtime)
docker-compose -f docker-compose.prod.yml up -d --no-deps --build uth_backend
docker-compose -f docker-compose.prod.yml up -d --no-deps --build uth_frontend
docker-compose -f docker-compose.prod.yml up -d --no-deps --build uth_ai
```

### 6.2 Dọn Dẹp

```bash
# Xóa images cũ
docker image prune -a -f

# Xóa volumes không dùng
docker volume prune -f

# Xóa containers stopped
docker container prune -f

# Xóa logs cũ
find /var/log/uth-confms -name "*.log" -mtime +30 -delete
```

### 6.3 Scale Services

**Tăng số workers cho Backend:**

```yaml
# docker-compose.prod.yml
services:
  backend:
    deploy:
      replicas: 3 # Chạy 3 instances
```

**Load balancing với Nginx:**

```nginx
upstream backend {
    server localhost:8080;
    server localhost:8081;
    server localhost:8082;
}

location /api {
    proxy_pass http://backend;
}
```

---

## 7. Bảo Mật

### 7.1 Checklist Bảo Mật

- [x] SSL/TLS enabled (HTTPS)
- [x] Strong JWT secret (64+ characters)
- [x] Database password mạnh
- [x] Firewall configured (UFW)
- [x] Rate limiting enabled
- [x] CORS configured properly
- [x] Security headers (Nginx)
- [x] Regular security updates
- [x] Backup encrypted
- [x] Audit logging enabled

### 7.2 Rate Limiting

**Nginx rate limiting:**

```nginx
# Giới hạn 10 requests/second
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

location /api {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://localhost:8080;
}
```

### 7.3 Fail2Ban

```bash
# Cài đặt Fail2Ban
sudo apt install fail2ban -y

# Cấu hình cho Nginx
sudo nano /etc/fail2ban/jail.local
```

```ini
[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/uth-confms-error.log
maxretry = 5
bantime = 3600
```

---

## 8. Disaster Recovery

### 8.1 Kế Hoạch Recovery

**RTO (Recovery Time Objective)**: 1 giờ  
**RPO (Recovery Point Objective)**: 24 giờ (backup hàng ngày)

### 8.2 Quy Trình Recovery

1. **Chuẩn bị server mới** (nếu server cũ hỏng)
2. **Cài đặt dependencies** (Docker, Nginx, etc.)
3. **Clone repository**
4. **Restore database** từ backup gần nhất
5. **Restore uploads** từ backup
6. **Cấu hình .env** với thông tin mới
7. **Khởi động services**
8. **Kiểm tra health checks**
9. **Update DNS** (nếu đổi IP)
10. **Thông báo users** về downtime

---

## Tài Liệu Liên Quan

- [Hướng Dẫn Cài Đặt](huong-dan-cai-dat.md)
- [Hướng Dẫn Sử Dụng](huong-dan-su-dung.md)
- [Tài Liệu Kiểm Thử](tai-lieu-kiem-thu.md)
- [Kiến Trúc Hệ Thống](architecture.md)

---

**Phiên Bản Tài Liệu**: 1.0  
**Cập Nhật Lần Cuối**: Tháng 01/2026  
**Người Bảo Trì**: Nhóm DevOps
