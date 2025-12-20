"""
API Endpoints cho các tính năng AI dành cho phản biện
Cung cấp tạo tóm tắt và trích xuất điểm chính cho phản biện.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field, validator
from core.nlp.synopsis_generator import get_synopsis_generator
from core.nlp.keypoint_extractor import get_keypoint_extractor
from core.governance.feature_flags import get_feature_flag_manager
from core.governance.audit_logger import get_audit_logger
from core.governance.double_blind import get_double_blind_validator
from core.infra.config import get_settings
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================
# Mô hình Request/Response
# ============================================

class GenerateSynopsisRequest(BaseModel):
    """Mô hình yêu cầu tạo tóm tắt."""
    paper_id: str = Field(..., description="Mã bài báo")
    title: str = Field(..., min_length=1, max_length=500, description="Tiêu đề bài báo")
    abstract: str = Field(..., min_length=1, max_length=2000, description="Tóm tắt bài báo")
    keywords: Optional[List[str]] = Field(default_factory=list, description="Từ khóa bài báo")
    conference_id: str = Field(..., description="Mã hội nghị")
    length: Literal["short", "medium", "long"] = Field("medium", description="Độ dài tóm tắt")
    language: str = Field("en", description="Mã ngôn ngữ")
    reviewer_id: Optional[str] = Field(None, description="Mã phản biện")
    
    @validator('language')
    def validate_language(cls, v):
        if v not in ['en', 'vi']:
            raise ValueError("Ngôn ngữ phải là 'en' hoặc 'vi'")
        return v


class GenerateSynopsisResponse(BaseModel):
    """Mô hình phản hồi tạo tóm tắt."""
    synopsis: str
    key_themes: List[str]
    methodology: str
    contribution_type: str
    generated_at: str
    model_used: str = Field(default_factory=lambda: get_settings().model_name)
    word_count: int
    length: str
    rationale: str


class ExtractKeyPointsRequest(BaseModel):
    """Mô hình yêu cầu trích xuất điểm chính."""
    paper_id: str = Field(..., description="Mã bài báo")
    title: str = Field(..., min_length=1, max_length=500, description="Tiêu đề bài báo")
    abstract: str = Field(..., min_length=1, max_length=2000, description="Tóm tắt bài báo")
    conference_id: str = Field(..., description="Mã hội nghị")
    language: str = Field("en", description="Mã ngôn ngữ")
    reviewer_id: Optional[str] = Field(None, description="Mã phản biện")
    
    @validator('language')
    def validate_language(cls, v):
        if v not in ['en', 'vi']:
            raise ValueError("Ngôn ngữ phải là 'en' hoặc 'vi'")
        return v


class ExtractKeyPointsResponse(BaseModel):
    """Mô hình phản hồi trích xuất điểm chính."""
    claims: List[Dict[str, Any]]
    methods: List[Dict[str, Any]]
    datasets: List[Dict[str, Any]]
    novelty: Optional[str] = None
    limitations: Optional[str] = None
    extracted_at: str
    model_used: str = Field(default_factory=lambda: get_settings().model_name)


# ============================================
# Hàm hỗ trợ
# ============================================

def _convert_keypoints(keypoints):
    """Chuyển đổi đối tượng KeyPoints thành dictionary."""
    return {
        "claims": [
            {"text": c.text, "confidence": c.confidence}
            for c in keypoints.claims
        ],
        "methods": [
            {"name": m.name, "details": m.details}
            for m in keypoints.methods
        ],
        "datasets": [
            {"name": d.name, "usage": d.usage}
            for d in keypoints.datasets
        ],
        "novelty": keypoints.novelty,
        "limitations": keypoints.limitations
    }


# ============================================
# API Endpoints
# ============================================

@router.post("/generate-synopsis", response_model=GenerateSynopsisResponse)
async def generate_synopsis(request: GenerateSynopsisRequest):
    """
    Tạo tóm tắt trung lập cho bài báo để giúp phản biện hiểu nội dung.
    
    - **paper_id**: Mã bài báo
    - **title**: Tiêu đề bài báo
    - **abstract**: Tóm tắt bài báo
    - **keywords**: Danh sách từ khóa tùy chọn
    - **conference_id**: Mã hội nghị
    - **length**: Độ dài tóm tắt ("short", "medium", "long")
    - **language**: Mã ngôn ngữ ("en" hoặc "vi")
    """
    # Kiểm tra feature flag
    feature_manager = get_feature_flag_manager()
    feature_enabled = await feature_manager.is_enabled(
        request.conference_id,
        "synopsis_generation"
    )
    
    if not feature_enabled:
        raise HTTPException(
            status_code=403,
            detail="Tính năng tạo tóm tắt chưa được bật cho hội nghị này"
        )
    
    try:
        # Tạo tóm tắt
        generator = get_synopsis_generator()
        synopsis = await generator.generate_synopsis(
            title=request.title,
            abstract=request.abstract,
            keywords=request.keywords,
            length=request.length,
            language=request.language
        )
        
        # Xác thực tuân thủ double-blind
        validator = get_double_blind_validator()
        validation = validator.validate_synopsis(
            synopsis.synopsis,
            {"title": request.title, "abstract": request.abstract}
        )
        
        if not validation["is_valid"]:
            logger.warning(
                f"Có vấn đề xác thực tóm tắt cho bài báo {request.paper_id}: {validation['issues']}"
            )
            # Sử dụng phiên bản đã được biên tập nếu phát hiện vấn đề
            synopsis_text = validation["redacted_synopsis"]
        else:
            synopsis_text = synopsis.synopsis
        
        # Ghi vào nhật ký kiểm toán
        audit_logger = get_audit_logger()
        audit_id = await audit_logger.log_operation(
            conference_id=request.conference_id,
            user_id=request.reviewer_id or "anonymous",
            feature="synopsis_generation",
            action="generate_synopsis",
            prompt=f"Title: {request.title[:500]}\nAbstract: {request.abstract[:500]}",
            model_id=get_settings().model_name,
            output_summary=f"Generated {request.length} synopsis: {synopsis.word_count} words",
            accepted=None
        )
        
        return GenerateSynopsisResponse(
            synopsis=synopsis_text,
            key_themes=synopsis.key_themes,
            methodology=synopsis.methodology,
            contribution_type=synopsis.contribution_type,
            generated_at=datetime.utcnow().isoformat() + "Z",
            model_used=get_settings().model_name,
            word_count=synopsis.word_count,
            length=request.length,
            rationale=synopsis.rationale
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Tạo tóm tắt thất bại: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Dịch vụ tạo tóm tắt không khả dụng")


@router.post("/extract-keypoints", response_model=ExtractKeyPointsResponse)
async def extract_keypoints(request: ExtractKeyPointsRequest):
    """
    Trích xuất điểm chính (tuyên bố, phương pháp, dataset, điểm mới, hạn chế) từ bài báo.
    
    - **paper_id**: Mã bài báo
    - **title**: Tiêu đề bài báo
    - **abstract**: Tóm tắt bài báo
    - **conference_id**: Mã hội nghị
    - **language**: Mã ngôn ngữ ("en" hoặc "vi")
    """
    # Kiểm tra feature flag
    feature_manager = get_feature_flag_manager()
    feature_enabled = await feature_manager.is_enabled(
        request.conference_id,
        "key_point_extraction"
    )
    
    if not feature_enabled:
        raise HTTPException(
            status_code=403,
            detail="Tính năng trích xuất điểm chính chưa được bật cho hội nghị này"
        )
    
    try:
        # Trích xuất điểm chính
        extractor = get_keypoint_extractor()
        keypoints = await extractor.extract_keypoints(
            title=request.title,
            abstract=request.abstract,
            language=request.language
        )
        
        # Ghi vào nhật ký kiểm toán
        audit_logger = get_audit_logger()
        audit_id = await audit_logger.log_operation(
            conference_id=request.conference_id,
            user_id=request.reviewer_id or "anonymous",
            feature="key_point_extraction",
            action="extract_keypoints",
            prompt=f"Title: {request.title[:500]}\nAbstract: {request.abstract[:500]}",
            model_id=get_settings().model_name,
            output_summary=f"Extracted {len(keypoints.claims)} claims, {len(keypoints.methods)} methods, {len(keypoints.datasets)} datasets",
            accepted=None
        )
        
        return ExtractKeyPointsResponse(
            claims=[
                {"text": c.text, "confidence": c.confidence}
                for c in keypoints.claims
            ],
            methods=[
                {"name": m.name, "details": m.details}
                for m in keypoints.methods
            ],
            datasets=[
                {"name": d.name, "usage": d.usage}
                for d in keypoints.datasets
            ],
            novelty=keypoints.novelty,
            limitations=keypoints.limitations,
            extracted_at=datetime.utcnow().isoformat() + "Z",
            model_used=get_settings().model_name
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Trích xuất điểm chính thất bại: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Dịch vụ trích xuất điểm chính không khả dụng")


@router.get("/paper-synopsis/{paper_id}")
async def get_paper_synopsis(
    paper_id: str,
    conference_id: str = Query(..., description="Mã hội nghị"),
    reviewer_id: Optional[str] = Query(None, description="Mã phản biện")
):
    """
    Lấy tóm tắt đã lưu cache của bài báo nếu có.
    Lưu ý: Endpoint này nên được triển khai trong backend service với database caching.
    Đây là một placeholder trả về thông báo.
    """
    # Endpoint này nên truy vấn database backend để lấy tóm tắt đã cache
    # Hiện tại, trả về thông báo cho biết cần tạo tóm tắt
    return {
        "message": "Tóm tắt chưa được lưu cache. Vui lòng sử dụng POST /generate-synopsis để tạo.",
        "paper_id": paper_id,
        "cached": False
    }



