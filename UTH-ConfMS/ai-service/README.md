# UTH-ConfMS AI Service

AI Service cho hệ thống quản lý hội nghị khoa học UTH-ConfMS, cung cấp các tính năng AI hỗ trợ với governance và audit logging đầy đủ.

## 📋 Tổng quan

AI Service được xây dựng bằng Python FastAPI, cung cấp:
- **Feature Flags**: Quản lý tính năng AI theo từng hội nghị
- **Audit Logging**: Ghi log đầy đủ cho mọi thao tác AI
- **Model Management**: Hỗ trợ nhiều provider (OpenAI, Anthropic, local)
- **Data Privacy**: Redaction PII cho double-blind review
- **Rate Limiting**: Giới hạn số lượng request theo hội nghị

## 🏗️ Kiến trúc

```
ai-service/
├── src/
│   ├── api/v1/          # API endpoints
│   │   ├── governance.py    # Governance endpoints
│   │   ├── authors.py       # Author AI features
│   │   ├── reviewers.py     # Reviewer AI features
│   │   ├── chairs.py        # Chair AI features
│   │   └── assignment.py    # Assignment AI features
│   ├── core/
│   │   ├── governance/      # Governance framework
│   │   │   ├── feature_flags.py   # Feature flag management
│   │   │   ├── audit_logger.py    # Audit logging
│   │   │   ├── model_manager.py   # LLM provider abstraction
│   │   │   └── data_privacy.py    # PII redaction
│   │   ├── infra/          # Infrastructure
│   │   │   ├── config.py          # Configuration management
│   │   │   └── logging_config.py  # Logging setup
│   │   ├── nlp/            # NLP modules
│   │   └── services/       # Core services
│   └── app/
│       ├── main.py         # FastAPI application
│       └── dependencies.py # Dependency injection
├── tests/                  # Unit tests
├── requirements.txt        # Python dependencies
└── Dockerfile             # Docker configuration
```

## 🚀 Cài đặt

### Yêu cầu

- Python 3.11+
- PostgreSQL 16+
- Redis (optional, cho feature flag caching)
- OpenAI API key hoặc Anthropic API key

### Bước 1: Clone và cài đặt dependencies

```bash
cd ai-service
pip install -r requirements.txt
```

### Bước 2: Cấu hình môi trường

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Cập nhật các biến môi trường trong `.env`:

```env
# AI Provider
AI_PROVIDER=openai
OPENAI_API_KEY=your_api_key_here

# Database
DATABASE_URL=postgresql://postgres:123456@localhost:5435/confms_db

# Redis (optional)
REDIS_URL=redis://localhost:6379
```

### Bước 3: Chạy database migration

Migration được quản lý bởi Flyway trong backend service. Đảm bảo migration `V10__create_ai_tables.sql` đã được chạy:

```sql
-- Migration tự động chạy khi backend khởi động
-- Hoặc chạy thủ công:
psql -U postgres -d confms_db -f ../backend/src/main/resources/db/migration/V10__create_ai_tables.sql
```

### Bước 4: Khởi động service

```bash
# Development
uvicorn src.app.main:app --reload --host 0.0.0.0 --port 8000

# Production
uvicorn src.app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## 📚 Sử dụng

### Feature Flags

Bật/tắt tính năng AI cho từng hội nghị:

```python
from core.governance.feature_flags import get_feature_flag_manager

manager = get_feature_flag_manager()

# Bật tính năng
await manager.enable_feature(
    conference_id="123",
    feature_name="spell_check"
)

# Kiểm tra trạng thái
is_enabled = await manager.is_enabled("123", "spell_check")
```

### Audit Logging

Ghi log mọi thao tác AI:

```python
from core.governance.audit_logger import get_audit_logger

logger = get_audit_logger()

await logger.log_operation(
    conference_id="123",
    user_id="456",
    feature="spell_check",
    action="check_spelling",
    prompt="User input text",
    model_id="gpt-4o-mini",
    output_summary="Fixed 5 spelling errors",
    accepted=True
)
```

### Model Manager

Sử dụng LLM với provider abstraction:

```python
from core.governance.model_manager import get_model_manager

manager = get_model_manager()

response = await manager.call_llm(
    prompt="Fix spelling errors in this text: ...",
    system_instruction="You are a spelling checker",
    conference_id="123"
)
```

### Data Privacy

Redact PII cho double-blind review:

```python
from core.governance.data_privacy import get_redaction_service

service = get_redaction_service()

result = service.anonymize_paper_content(
    text="Paper content with author names...",
    author_names=["John Doe", "Jane Smith"],
    redact_emails=True,
    redact_urls=True
)

print(result.redacted_text)
print(result.redacted_items)
```

## 🔌 API Endpoints

### Governance Endpoints

#### Enable Feature
```http
POST /api/v1/governance/features/enable
Content-Type: application/json

{
  "conference_id": "123",
  "feature_name": "spell_check",
  "user_id": "456"
}
```

#### Disable Feature
```http
POST /api/v1/governance/features/disable
Content-Type: application/json

{
  "conference_id": "123",
  "feature_name": "spell_check"
}
```

#### Get Feature Flags
```http
GET /api/v1/governance/features/{conference_id}
```

#### Get Audit Logs
```http
GET /api/v1/governance/audit-logs?conference_id=123&limit=100&offset=0
```

#### Get Usage Statistics
```http
GET /api/v1/governance/usage-stats/{conference_id}?feature=spell_check&start_date=2025-01-01T00:00:00Z
```

## 🧪 Testing

Chạy unit tests:

```bash
# Tất cả tests
pytest

# Test cụ thể
pytest tests/test_feature_flags.py
pytest tests/test_audit_logger.py
pytest tests/test_model_manager.py

# Với coverage
pytest --cov=src --cov-report=html
```

## 📊 Monitoring

### Audit Logs

Tất cả thao tác AI được ghi log vào bảng `ai_audit_logs` với:
- Timestamp
- Conference ID
- User ID
- Feature name
- Action performed
- Input hash (SHA256)
- Output summary
- Acceptance status

### Usage Statistics

Xem thống kê sử dụng:

```python
from core.governance.audit_logger import get_audit_logger

logger = get_audit_logger()
stats = await logger.get_usage_stats(
    conference_id="123",
    feature="spell_check",
    start_date=datetime(2025, 1, 1),
    end_date=datetime(2025, 1, 31)
)
```

## 🔒 Security & Privacy

- **PII Redaction**: Tự động redact thông tin cá nhân trong double-blind review
- **Input Hashing**: Hash SHA256 cho mọi input để tracking và deduplication
- **Rate Limiting**: Giới hạn số lượng request theo hội nghị
- **Audit Trail**: Ghi log đầy đủ cho compliance

## 🛠️ Development

### Code Style

- Tuân thủ PEP 8
- Sử dụng type hints cho tất cả functions
- Docstrings cho mọi module và function
- Error handling đầy đủ

### Adding New Features

1. Thêm feature name vào `AVAILABLE_FEATURES` trong `feature_flags.py`
2. Implement feature logic trong module tương ứng
3. Sử dụng `get_model_manager()` cho LLM calls
4. Sử dụng `get_audit_logger()` để ghi log
5. Kiểm tra feature flag trước khi thực thi

## 📝 License

Internal use only - UTH-ConfMS Project

## 🤝 Contributing

Xem [CONTRIBUTING.md](../docs/CONTRIBUTING.md) để biết hướng dẫn đóng góp.

## 📞 Support

Liên hệ team phát triển qua email hoặc issue tracker.


