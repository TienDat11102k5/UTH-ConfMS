# Database Backup Scripts

Các script để backup và restore database PostgreSQL cho hệ thống UTH-ConfMS.

## 📋 Danh sách Scripts

### 1. backup-docker.ps1 ⭐ (Recommended for Windows)
Script backup database sử dụng Docker container (không cần cài PostgreSQL client).

**Tính năng:**
- Backup database qua Docker container
- Không cần cài đặt PostgreSQL client tools
- Tự động nén file backup (.zip)
- Tự động xóa backup cũ (> 7 ngày)
- Hoạt động trên Windows/Linux/Mac

**Sử dụng:**
```powershell
cd uth-confms
.\scripts\backup-docker.ps1
```

### 2. backup-database.ps1 (Windows - Requires PostgreSQL)
Script backup database trực tiếp (yêu cầu cài PostgreSQL client tools).

**Tính năng:**
- Backup database PostgreSQL dạng custom format
- Tự động nén file backup (.zip)
- Tự động xóa backup cũ (> 7 ngày)
- Hỗ trợ environment variables

**Yêu cầu:**
- PostgreSQL client tools (pg_dump)
- Download: https://www.postgresql.org/download/

**Sử dụng:**
```powershell
cd uth-confms
.\scripts\backup-database.ps1
```

### 3. backup-database.sh (Linux/Mac)
Script backup database cho Linux/Mac.

**Tính năng:**
- Backup database PostgreSQL dạng custom format
- Tự động nén file backup (.gz)
- Tự động xóa backup cũ (> 7 ngày)
- Hỗ trợ environment variables

**Sử dụng:**
```bash
cd uth-confms
./scripts/backup-database.sh
```

### 4. restore-database.ps1 (Windows)
Script restore database từ file backup cho Windows.

**Tính năng:**
- Restore database từ file backup
- Hỗ trợ file đã nén (.zip)
- Có confirmation trước khi restore
- Tự động drop và recreate database

**Sử dụng:**
```powershell
cd uth-confms
.\scripts\restore-database.ps1 .\backups\uth_confms_backup_20251229_001738.sql.zip
```

### 5. restore-database.sh (Linux/Mac)
Script restore database từ file backup.

**Tính năng:**
- Restore database từ file backup
- Hỗ trợ file đã nén (.gz)
- Có confirmation trước khi restore
- Tự động drop và recreate database

---

## 🚀 Sử dụng

### Backup Database

```bash
# Chạy backup thủ công
./scripts/backup-database.sh

# Hoặc với custom configuration
DB_HOST=localhost DB_PORT=5435 DB_NAME=confms_db ./scripts/backup-database.sh
```

### Restore Database

```bash
# Restore từ file backup
./scripts/restore-database.sh backups/uth_confms_backup_20251223_120000.sql.gz

# Hoặc với custom configuration
DB_HOST=localhost DB_PORT=5435 ./scripts/restore-database.sh backups/backup_file.sql.gz
```

---

## ⚙️ Configuration

Các biến môi trường có thể override:

| Variable | Default | Description |
|----------|---------|-------------|
| DB_HOST | localhost | Database host |
| DB_PORT | 5435 | Database port |
| DB_NAME | confms_db | Database name |
| DB_USER | postgres | Database user |
| DB_PASSWORD | 123456 | Database password |
| BACKUP_DIR | ./backups | Thư mục chứa backup |
| RETENTION_DAYS | 7 | Số ngày giữ backup |

---

## 📅 Automated Backup (Cron)

### Linux/MacOS

Thêm vào crontab để chạy tự động:

```bash
# Mở crontab editor
crontab -e

# Thêm dòng này để backup mỗi ngày lúc 2:00 AM
0 2 * * * cd /path/to/UTH-ConfMS && ./scripts/backup-database.sh >> /var/log/uth-confms-backup.log 2>&1
```

### Windows (Task Scheduler)

Sử dụng Git Bash hoặc WSL để chạy script:

```powershell
# Tạo task scheduler chạy mỗi ngày
schtasks /create /tn "UTH-ConfMS Backup" /tr "C:\path\to\git-bash.exe /path/to/scripts/backup-database.sh" /sc daily /st 02:00
```

---

## 🐳 Docker Usage

Nếu sử dụng Docker, các script sẽ tự động chạy trong container `uth_confms_backup`.

Xem logs:
```bash
docker logs uth_confms_backup
```

Manual backup trong Docker:
```bash
docker exec uth_confms_backup /scripts/backup-database.sh
```

Manual restore trong Docker:
```bash
docker exec -it uth_confms_backup /scripts/restore-database.sh /backups/backup_file.sql.gz
```

---

## 📦 Backup File Format

File backup được đặt tên theo format:

```
uth_confms_backup_YYYYMMDD_HHMMSS.sql.gz
```

Ví dụ:
```
uth_confms_backup_20251223_140530.sql.gz
```

---

## ⚠️ Lưu ý

1. **Permissions**: Đảm bảo scripts có quyền execute:
   ```bash
   chmod +x scripts/*.sh
   ```

2. **PostgreSQL Client**: Cần cài đặt `pg_dump` và `pg_restore`:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql-client
   
   # MacOS
   brew install postgresql
   ```

3. **Disk Space**: Đảm bảo đủ dung lượng cho backup files.

4. **Security**: Không hardcode password trong scripts. Sử dụng environment variables hoặc `.pgpass` file.

5. **Testing**: Luôn test restore script trên test environment trước.

---

## 🔧 Troubleshooting

### Lỗi "permission denied"
```bash
chmod +x scripts/backup-database.sh scripts/restore-database.sh
```

### Lỗi "command not found: pg_dump"
Cài đặt PostgreSQL client tools.

### Lỗi "connection refused"
Kiểm tra DB_HOST và DB_PORT, đảm bảo PostgreSQL đang chạy.

### Backup quá lớn
Có thể tăng compression level hoặc backup theo schedule thường xuyên hơn.

---

## 📞 Support

Nếu có vấn đề, tạo issue trên GitHub hoặc liên hệ team.
