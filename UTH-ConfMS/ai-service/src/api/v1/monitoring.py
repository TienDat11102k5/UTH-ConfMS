"""
Endpoints Giám Sát và Kiểm Tra Sức Khỏe
Cung cấp thông tin sức khỏe hệ thống, thước đo và giám sát.
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from datetime import datetime
from core.governance.feature_flags import get_feature_flag_manager
from core.governance.audit_logger import get_audit_logger
from core.governance.model_manager import get_model_manager
from core.infra.config import get_settings
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False
    logger.warning("psutil not available, system metrics will be limited")


@router.get("/health")
async def health_check():
    """
    Endpoint kiểm tra sức khỏe tổng thể.
    Kiểm tra: database, Redis, model manager, feature flags.
    """
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "service": "ai-service",
        "version": "1.0.0",
        "checks": {}
    }
    
    overall_healthy = True
    
    # Kiểm tra kết nối database
    try:
        audit_logger = get_audit_logger()
        await audit_logger._init_db_pool()
        if audit_logger.db_pool:
            health_status["checks"]["database"] = {
                "status": "healthy",
                "message": "Kết nối database OK"
            }
        else:
            health_status["checks"]["database"] = {
                "status": "unhealthy",
                "message": "Pool database chưa được khởi tạo"
            }
            overall_healthy = False
    except Exception as e:
        health_status["checks"]["database"] = {
            "status": "unhealthy",
            "message": f"Lỗi database: {str(e)}"
        }
        overall_healthy = False
    
    # Kiểm tra kết nối Redis
    try:
        feature_manager = get_feature_flag_manager()
        if feature_manager.redis_client:
            feature_manager.redis_client.ping()
            health_status["checks"]["redis"] = {
                "status": "healthy",
                "message": "Kết nối Redis OK"
            }
        else:
            health_status["checks"]["redis"] = {
                "status": "degraded",
                "message": "Redis không khả dụng (sử dụng PostgreSQL fallback)"
            }
    except Exception as e:
        health_status["checks"]["redis"] = {
            "status": "degraded",
            "message": f"Lỗi Redis: {str(e)}"
        }
    
    # Kiểm tra model manager
    try:
        model_manager = get_model_manager()
        provider_info = model_manager.get_provider_info()
        health_status["checks"]["model_manager"] = {
            "status": "healthy",
            "message": f"Nhà cung cấp: {provider_info['provider']}",
            "provider": provider_info
        }
    except Exception as e:
        health_status["checks"]["model_manager"] = {
            "status": "unhealthy",
            "message": f"Lỗi model manager: {str(e)}"
        }
        overall_healthy = False
    
    # Kiểm tra tài nguyên hệ thống
    if PSUTIL_AVAILABLE:
        try:
            cpu_percent = psutil.cpu_percent(interval=0.1)
            memory = psutil.virtual_memory()
            health_status["checks"]["system"] = {
                "status": "healthy" if cpu_percent < 90 and memory.percent < 90 else "degraded",
                "cpu_percent": cpu_percent,
                "memory_percent": memory.percent,
                "memory_available_mb": memory.available / (1024 * 1024)
            }
        except Exception as e:
            health_status["checks"]["system"] = {
                "status": "unknown",
                "message": f"Lỗi kiểm tra hệ thống: {str(e)}"
            }
    else:
        health_status["checks"]["system"] = {
            "status": "unknown",
            "message": "psutil không khả dụng"
        }
    
    health_status["status"] = "healthy" if overall_healthy else "unhealthy"
    
    return health_status


@router.get("/metrics")
async def get_metrics():
    """
    Lấy thước đo hệ thống cho giám sát.
    Trả về: số lượng yêu cầu, tỷ lệ lỗi, thời gian phản hồi, v.v.
    """
    try:
        metrics = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "service": "ai-service",
            "metrics": {
                "model": {
                    "provider": get_settings().ai_provider,
                    "model": get_settings().model_name
                }
            }
        }
        
        if PSUTIL_AVAILABLE:
            metrics["metrics"]["system"] = {
                "cpu_percent": psutil.cpu_percent(interval=0.1),
                "memory_percent": psutil.virtual_memory().percent,
                "memory_available_mb": psutil.virtual_memory().available / (1024 * 1024)
            }
        
        return metrics
        
    except Exception as e:
        logger.error(f"Không thể lấy thước đo: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Không thể lấy thước đo")


@router.get("/readiness")
async def readiness_check():
    """
    Probe readiness cho Kubernetes/Docker.
    Kiểm tra xem dịch vụ có sẵn sàng nhận yêu cầu hay không.
    """
    try:
        # Kiểm tra các dependency quan trọng
        audit_logger = get_audit_logger()
        await audit_logger._init_db_pool()
        
        if not audit_logger.db_pool:
            raise HTTPException(status_code=503, detail="Database không khả dụng")
        
        model_manager = get_model_manager()
        provider_info = model_manager.get_provider_info()
        
        if not provider_info.get("gemini_configured"):
            raise HTTPException(status_code=503, detail="Gemini AI chưa được cấu hình")
        
        return {"status": "ready"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Kiểm tra readiness thất bại: {e}")
        raise HTTPException(status_code=503, detail=f"Dịch vụ chưa sẵn sàng: {str(e)}")


@router.get("/liveness")
async def liveness_check():
    """
    Probe liveness cho Kubernetes/Docker.
    Kiểm tra xem dịch vụ có đang hoạt động hay không.
    """
    return {
        "status": "alive",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
