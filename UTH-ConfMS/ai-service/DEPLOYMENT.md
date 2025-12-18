# AI Service Deployment Guide

## 📋 Tổng quan

Hướng dẫn deploy AI Service cho UTH-ConfMS với Docker và monitoring.

## 🐳 Docker Deployment

### Prerequisites

- Docker và Docker Compose đã cài đặt
- PostgreSQL 16+ đang chạy
- Redis (optional, nhưng khuyến nghị)
- OpenAI API key hoặc Anthropic API key

### Quick Start

1. **Clone repository và navigate đến thư mục docker:**

```bash
cd UTH-ConfMS/docker
```

2. **Copy và cấu hình environment variables:**

```bash
cp ai-service.env.example ../ai-service/.env
# Edit .env và thêm OPENAI_API_KEY
```

3. **Build và start services:**

```bash
docker-compose up -d
```

4. **Verify AI service is running:**

```bash
curl http://localhost:8001/health
```

### Environment Variables

Các biến môi trường quan trọng trong `.env`:

```env
# Required
OPENAI_API_KEY=your_api_key_here
DATABASE_URL=postgresql://postgres:123456@postgres:5432/confms_db
REDIS_URL=redis://redis:6379

# Optional
AI_PROVIDER=openai
MODEL_NAME=gpt-4o-mini
MAX_TOKENS=2000
```

## 🏥 Health Checks

### Endpoints

- **GET /health** - Comprehensive health check
- **GET /api/v1/readiness** - Kubernetes readiness probe
- **GET /api/v1/liveness** - Kubernetes liveness probe
- **GET /api/v1/metrics** - System metrics

### Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2025-01-XXT10:30:00Z",
  "service": "ai-service",
  "version": "1.0.0",
  "checks": {
    "database": {"status": "healthy", "message": "Database connection OK"},
    "redis": {"status": "healthy", "message": "Redis connection OK"},
    "model_manager": {"status": "healthy", "provider": "openai"},
    "system": {"cpu_percent": 25.5, "memory_percent": 45.2}
  }
}
```

## 📊 Monitoring

### Metrics Endpoint

```bash
curl http://localhost:8001/api/v1/metrics
```

Returns:
- System resources (CPU, memory)
- Model provider information
- Feature flags status

### Logging

Logs được output ra stdout/stderr và có thể được collect bởi Docker logging driver hoặc log aggregation service.

Log levels:
- `INFO`: Normal operations
- `WARNING`: Non-critical issues
- `ERROR`: Errors requiring attention

## 🔧 Configuration

### Production Settings

1. **Update `application.properties` hoặc environment variables:**

```properties
# AI Service URL (for backend)
AI_SERVICE_URL=http://ai-service:8000
```

2. **Enable features per conference:**

```bash
# Via API
curl -X POST http://localhost:8001/api/v1/governance/features/enable \
  -H "Content-Type: application/json" \
  -d '{
    "conference_id": "123",
    "feature_name": "spell_check"
  }'
```

## 🚀 Kubernetes Deployment (Optional)

### Deployment YAML Example

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ai-service
  template:
    metadata:
      labels:
        app: ai-service
    spec:
      containers:
      - name: ai-service
        image: uth-confms/ai-service:latest
        ports:
        - containerPort: 8000
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: ai-secrets
              key: openai-api-key
        - name: DATABASE_URL
          valueFrom:
            configMapKeyRef:
              name: ai-config
              key: database-url
        livenessProbe:
          httpGet:
            path: /api/v1/liveness
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/v1/readiness
            port: 8000
          initialDelaySeconds: 20
          periodSeconds: 5
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
```

## 🧪 Testing

### Run Unit Tests

```bash
cd ai-service
pytest tests/ -v
```

### Run Integration Tests

```bash
pytest tests/integration/ -v
```

### Run All Tests with Coverage

```bash
pytest --cov=src --cov-report=html
```

## 📈 Performance Tuning

### Embedding Caching

Embeddings được cache trong Redis với TTL 7 ngày. Để tăng performance:

1. **Increase Redis memory:**
```yaml
redis:
  command: redis-server --maxmemory 2gb --maxmemory-policy allkeys-lru
```

2. **Pre-compute embeddings:**
- Khi papers được submit
- Khi reviewers được invite

### Rate Limiting

Default: 100 requests per conference per hour. Adjust trong `.env`:

```env
RATE_LIMIT_PER_CONFERENCE=200
RATE_LIMIT_WINDOW_SECONDS=3600
```

## 🔒 Security

### API Keys

- **Never commit API keys** to version control
- Use environment variables hoặc secrets management
- Rotate keys regularly

### Network Security

- AI service chỉ nên accessible từ backend service
- Use internal network trong Docker/Kubernetes
- Enable HTTPS trong production

## 🐛 Troubleshooting

### Service không start

1. Check logs:
```bash
docker logs uth_ai
```

2. Check health:
```bash
curl http://localhost:8001/health
```

3. Verify environment variables:
```bash
docker exec uth_ai env | grep OPENAI
```

### Database connection errors

1. Verify PostgreSQL is running:
```bash
docker ps | grep postgres
```

2. Check connection string:
```bash
docker exec uth_ai env | grep DATABASE_URL
```

### Redis connection errors

Redis là optional. Service sẽ fallback về PostgreSQL nếu Redis không available.

## 📝 Maintenance

### Update Dependencies

```bash
cd ai-service
pip install --upgrade -r requirements.txt
docker-compose build ai-service
docker-compose up -d ai-service
```

### Database Migrations

Migrations được handle bởi backend service (Flyway). Đảm bảo migration V10, V11, V12 đã chạy.

### Backup

- Audit logs: Backup bảng `ai_audit_logs` regularly
- Feature flags: Backup bảng `ai_feature_flags`
- Email drafts: Backup bảng `email_drafts`

## 📞 Support

Xem logs để troubleshoot:
```bash
docker logs -f uth_ai
```

Liên hệ team phát triển nếu cần hỗ trợ.


