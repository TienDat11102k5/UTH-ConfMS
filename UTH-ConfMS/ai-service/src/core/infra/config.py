"""
Quản lý Cấu hình sử dụng Pydantic Settings
Cấu hình tập trung cho Dịch vụ AI.
"""
import os
from typing import Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    """Cài đặt ứng dụng với hỗ trợ biến môi trường."""
    
    # Cấu hình Nhà cung cấp AI
    ai_provider: str = "openai"  # openai, anthropic, local
    model_name: str = "gpt-4o-mini"
    max_tokens: int = 2000
    temperature: float = 0.3
    
    # Khóa API
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    
    # Cấu hình Cơ sở dữ liệu
    database_url: str = "postgresql://postgres:123456@localhost:5435/confms_db"
    
    # Cấu hình Redis
    redis_url: Optional[str] = "redis://localhost:6379"
    
    # Cấu hình Dịch vụ
    host: str = "0.0.0.0"
    port: int = 8000
    log_level: str = "info"
    
    # Cấu hình CORS
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    
    @field_validator('cors_origins')
    @classmethod
    def split_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',')]
        return v
    
    # Giới hạn tốc độ
    rate_limit_per_conference: int = 100
    rate_limit_window_seconds: int = 3600
    
    # Cờ Tính năng
    feature_flags_cache_ttl: int = 3600
    
    # Ghi nhật ký Kiểm toán
    audit_log_retention_days: int = 365
    
    # Bảo mật Dữ liệu
    enable_pii_redaction: bool = True
    
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


