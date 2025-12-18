"""
Quản lý Cấu hình sử dụng Pydantic Settings
Cấu hình tập trung cho Dịch vụ AI.
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    """Cài đặt ứng dụng với hỗ trợ biến môi trường."""
    
    # Cấu hình Nhà cung cấp AI
    ai_provider: str = os.getenv("AI_PROVIDER", "openai")  # openai, anthropic, local
    model_name: str = os.getenv("MODEL_NAME", "gpt-4o-mini")
    max_tokens: int = int(os.getenv("MAX_TOKENS", "2000"))
    temperature: float = float(os.getenv("TEMPERATURE", "0.3"))
    
    # Khóa API
    openai_api_key: Optional[str] = os.getenv("OPENAI_API_KEY")
    anthropic_api_key: Optional[str] = os.getenv("ANTHROPIC_API_KEY")
    
    # Cấu hình Cơ sở dữ liệu
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:123456@localhost:5435/confms_db"
    )
    
    # Cấu hình Redis
    redis_url: Optional[str] = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # Cấu hình Dịch vụ
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8000"))
    log_level: str = os.getenv("LOG_LEVEL", "info")
    
    # Cấu hình CORS
    cors_origins: list[str] = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:3000"
    ).split(",")
    
    # Giới hạn tốc độ
    rate_limit_per_conference: int = int(os.getenv("RATE_LIMIT_PER_CONFERENCE", "100"))
    rate_limit_window_seconds: int = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "3600"))
    
    # Cờ Tính năng
    feature_flags_cache_ttl: int = int(os.getenv("FEATURE_FLAGS_CACHE_TTL", "3600"))
    
    # Ghi nhật ký Kiểm toán
    audit_log_retention_days: int = int(os.getenv("AUDIT_LOG_RETENTION_DAYS", "365"))
    
    # Bảo mật Dữ liệu
    enable_pii_redaction: bool = os.getenv("ENABLE_PII_REDACTION", "true").lower() == "true"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )


@lru_cache()
def get_settings() -> Settings:
    """Lấy instance settings đã cache."""
    return Settings()


