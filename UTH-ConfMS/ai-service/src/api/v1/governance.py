"""
API Endpoints Quản Trị
Cung cấp các endpoint cho quản lý feature flag, nhật ký kiểm toán và thống kê sử dụng.
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from core.governance.feature_flags import (
    get_feature_flag_manager,
    AVAILABLE_FEATURES
)
from core.governance.audit_logger import get_audit_logger
from core.infra.config import get_settings

router = APIRouter()


# ============================================
# Mô hình Request/Response
# ============================================

class FeatureFlagRequest(BaseModel):
    """Mô hình yêu cầu cho thao tác feature flag."""
    conference_id: str = Field(..., description="UUID của hội nghị")
    feature_name: str = Field(..., description="Tên của tính năng")
    user_id: Optional[str] = Field(None, description="Mã người dùng thực hiện thay đổi")


class FeatureFlagResponse(BaseModel):
    """Mô hình phản hồi cho trạng thái feature flag."""
    conference_id: str
    feature_name: str
    enabled: bool
    message: str


class FeatureFlagsListResponse(BaseModel):
    """Mô hình phản hồi cho danh sách tất cả feature flags."""
    conference_id: str
    features: Dict[str, bool]


class AuditLogQuery(BaseModel):
    """Tham số truy vấn cho nhật ký kiểm toán."""
    conference_id: Optional[str] = None
    user_id: Optional[str] = None
    feature: Optional[str] = None
    limit: int = Field(100, ge=1, le=1000)
    offset: int = Field(0, ge=0)


class UsageStatsRequest(BaseModel):
    """Mô hình yêu cầu cho thống kê sử dụng."""
    conference_id: str
    feature: Optional[str] = None
    start_date: Optional[str] = None  # Định dạng ISO8601
    end_date: Optional[str] = None    # Định dạng ISO8601


# ============================================
# Feature Flag Endpoints
# ============================================

@router.post("/features/enable", response_model=FeatureFlagResponse)
async def enable_feature(request: FeatureFlagRequest):
    """
    Bật một tính năng AI cho hội nghị.
    
    - **conference_id**: UUID của hội nghị
    - **feature_name**: Tên tính năng cần bật
    - **user_id**: Mã người dùng bật tính năng (tùy chọn)
    """
    if request.feature_name not in AVAILABLE_FEATURES:
        raise HTTPException(
            status_code=400,
            detail=f"Tên tính năng không hợp lệ. Các tính năng khả dụng: {', '.join(AVAILABLE_FEATURES)}"
        )
    
    manager = get_feature_flag_manager()
    success = await manager.enable_feature(
        conference_id=request.conference_id,
        feature_name=request.feature_name,
        user_id=request.user_id
    )
    
    if not success:
        raise HTTPException(
            status_code=500,
            detail="Không thể bật tính năng"
        )
    
    return FeatureFlagResponse(
        conference_id=request.conference_id,
        feature_name=request.feature_name,
        enabled=True,
        message=f"Tính năng {request.feature_name} đã được bật cho hội nghị {request.conference_id}"
    )


@router.post("/features/disable", response_model=FeatureFlagResponse)
async def disable_feature(request: FeatureFlagRequest):
    """
    Tắt một tính năng AI cho hội nghị.
    
    - **conference_id**: UUID của hội nghị
    - **feature_name**: Tên tính năng cần tắt
    - **user_id**: Mã người dùng tắt tính năng (tùy chọn)
    """
    if request.feature_name not in AVAILABLE_FEATURES:
        raise HTTPException(
            status_code=400,
            detail=f"Tên tính năng không hợp lệ. Các tính năng khả dụng: {', '.join(AVAILABLE_FEATURES)}"
        )
    
    manager = get_feature_flag_manager()
    success = await manager.disable_feature(
        conference_id=request.conference_id,
        feature_name=request.feature_name,
        user_id=request.user_id
    )
    
    if not success:
        raise HTTPException(
            status_code=500,
            detail="Không thể tắt tính năng"
        )
    
    return FeatureFlagResponse(
        conference_id=request.conference_id,
        feature_name=request.feature_name,
        enabled=False,
        message=f"Tính năng {request.feature_name} đã được tắt cho hội nghị {request.conference_id}"
    )


@router.get("/features/{conference_id}", response_model=FeatureFlagsListResponse)
async def get_feature_flags(conference_id: str):
    """
    Lấy tất cả feature flags cho một hội nghị.
    
    - **conference_id**: UUID của hội nghị
    """
    manager = get_feature_flag_manager()
    features = await manager.get_all_features(conference_id)
    
    return FeatureFlagsListResponse(
        conference_id=conference_id,
        features=features
    )


@router.get("/features", response_model=List[str])
async def list_available_features():
    """
    Liệt kê tất cả các tính năng AI khả dụng.
    """
    return AVAILABLE_FEATURES


# ============================================
# Audit Log Endpoints
# ============================================

@router.get("/audit-logs")
async def get_audit_logs(
    conference_id: Optional[str] = Query(None, description="Lọc theo mã hội nghị"),
    user_id: Optional[str] = Query(None, description="Lọc theo mã người dùng"),
    feature: Optional[str] = Query(None, description="Lọc theo tên tính năng"),
    limit: int = Query(100, ge=1, le=1000, description="Số bản ghi tối đa"),
    offset: int = Query(0, ge=0, description="Vị trí bắt đầu cho phân trang")
):
    """
    Lấy nhật ký kiểm toán với lọc tùy chọn.
    
    - **conference_id**: Lọc theo mã hội nghị (tùy chọn)
    - **user_id**: Lọc theo mã người dùng (tùy chọn)
    - **feature**: Lọc theo tên tính năng (tùy chọn)
    - **limit**: Số bản ghi tối đa (1-1000)
    - **offset**: Vị trí bắt đầu cho phân trang
    """
    logger = get_audit_logger()
    logs = await logger.get_audit_logs(
        conference_id=conference_id,
        user_id=user_id,
        feature=feature,
        limit=limit,
        offset=offset
    )
    
    return {
        "logs": logs,
        "total": len(logs),
        "limit": limit,
        "offset": offset
    }


# ============================================
# Usage Statistics Endpoints
# ============================================

@router.get("/usage-stats/{conference_id}")
async def get_usage_stats(
    conference_id: str,
    feature: Optional[str] = Query(None, description="Lọc theo tên tính năng"),
    start_date: Optional[str] = Query(None, description="Ngày bắt đầu (ISO8601)"),
    end_date: Optional[str] = Query(None, description="Ngày kết thúc (ISO8601)")
):
    """
    Lấy thống kê sử dụng cho một hội nghị.
    
    - **conference_id**: UUID của hội nghị
    - **feature**: Tên tính năng để lọc (tùy chọn)
    - **start_date**: Ngày bắt đầu (ISO8601)
    - **end_date**: Ngày kết thúc (ISO8601)
    """
    logger = get_audit_logger()
    
    # Phân tích ngày nếu được cung cấp
    start_dt = None
    end_dt = None
    
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Định dạng start_date không hợp lệ. Sử dụng định dạng ISO8601 (ví dụ: 2025-01-01T00:00:00Z)"
            )
    
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Định dạng end_date không hợp lệ. Sử dụng định dạng ISO8601 (ví dụ: 2025-01-01T23:59:59Z)"
            )
    
    stats = await logger.get_usage_stats(
        conference_id=conference_id,
        feature=feature,
        start_date=start_dt,
        end_date=end_dt
    )
    
    return stats


@router.get("/usage-stats/{conference_id}/acceptance-rate")
async def get_acceptance_rate(
    conference_id: str,
    feature: Optional[str] = Query(None, description="Lọc theo tên tính năng"),
    days: int = Query(30, ge=1, le=365, description="Số ngày nhìn lại")
):
    """
    Lấy tỷ lệ chấp nhận cho một hội nghị/tính năng.
    
    - **conference_id**: UUID của hội nghị
    - **feature**: Tên tính năng (tùy chọn)
    - **days**: Số ngày nhìn lại (1-365)
    """
    logger = get_audit_logger()
    rate = await logger.get_acceptance_rate(
        conference_id=conference_id,
        feature=feature,
        days=days
    )
    
    return {
        "conference_id": conference_id,
        "feature": feature,
        "acceptance_rate": rate,
        "period_days": days
    }


# ============================================
# Health Check Endpoint
# ============================================

@router.get("/health")
async def governance_health():
    """
    Kiểm tra sức khỏe cho dịch vụ quản trị.
    """
    settings = get_settings()
    
    return {
        "status": "ok",
        "service": "governance",
        "provider": settings.ai_provider,
        "features_available": len(AVAILABLE_FEATURES)
    }


