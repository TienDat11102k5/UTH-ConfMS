from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.v1 import authors, reviewers, chairs, assignment, governance, monitoring
from core.infra.config import get_settings
import logging

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)
settings = get_settings()

app = FastAPI(
    title="UTH-ConfMS AI Service",
    version="1.0.0",
    description="Các tính năng AI cho hệ thống quản lý bài báo hội nghị khoa học"
)

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Khai báo các router
app.include_router(authors.router, prefix="/api/v1/authors", tags=["Authors"])
app.include_router(reviewers.router, prefix="/api/v1/reviewers", tags=["Reviewers"])
app.include_router(chairs.router, prefix="/api/v1/chairs", tags=["Chairs"])
app.include_router(assignment.router, prefix="/api/v1/assignment", tags=["Assignment"])
app.include_router(governance.router, prefix="/api/v1/governance", tags=["Governance"])
app.include_router(monitoring.router, prefix="/api/v1", tags=["Monitoring"])

@app.get("/health")
def health_check():
    """Điểm kiểm tra sức khỏe của hệ thống để giám sát."""
    return {
        "status": "ok",
        "service": "ai-service",
        "version": "1.0.0"
    }

@app.get("/")
def root():
    """Điểm truy cập gốc của API."""
    return {
        "service": "UTH-ConfMS AI Service",
        "version": "1.0.0",
        "status": "running"
    }

@app.on_event("startup")
async def startup_event():
    """Khởi tạo các dịch vụ khi khởi động hệ thống."""
    logger.info("Dịch vụ AI đang khởi động...")
    logger.info(f"Nhà cung cấp AI: {settings.ai_provider}")
    logger.info(f"Mô hình: {settings.model_name}")
    logger.info("Dịch vụ AI đã sẵn sàng")

@app.on_event("shutdown")
async def shutdown_event():
    """Dọn dẹp tài nguyên khi tắt hệ thống."""
    logger.info("Dịch vụ AI đang tắt...")
    # Đóng các kết nối nếu cần
    try:
        from core.governance.feature_flags import get_feature_flag_manager
        manager = get_feature_flag_manager()
        await manager.close()
    except Exception as e:
        logger.warning(f"Lỗi khi đóng feature flag manager: {e}")
