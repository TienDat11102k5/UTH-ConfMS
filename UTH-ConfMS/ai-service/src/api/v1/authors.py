"""
API Endpoints cho các tính năng AI dành cho tác giả
Cung cấp kiểm tra chính tả, ngữ pháp, đánh bóng tóm tắt và gợi ý từ khóa cho tác giả.
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, validator
from core.nlp.language_checker import (
    get_spell_checker,
    get_grammar_checker,
    SpellingError,
    GrammarError
)
from core.nlp.abstract_enhancer import (
    get_abstract_polisher,
    PolishResult
)
from core.nlp.keyword_extractor import (
    get_keyword_suggester,
    Keyword
)
from core.governance.feature_flags import get_feature_flag_manager
from core.governance.audit_logger import get_audit_logger
from core.governance.model_manager import get_model_manager
import logging
import uuid

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================
# Mô hình Request/Response
# ============================================
class SpellCheckRequest(BaseModel):
    """Mô hình yêu cầu kiểm tra chính tả."""
    text: str = Field(..., min_length=1, max_length=10000, description="Văn bản cần kiểm tra")
    language: str = Field("en", description="Mã ngôn ngữ: 'en' hoặc 'vi'")
    conference_id: str = Field(..., description="Mã hội nghị")
    user_id: Optional[str] = Field(None, description="Mã người dùng")
    
    @validator('language')
    def validate_language(cls, v):
        if v not in ['en', 'vi']:
            raise ValueError("Ngôn ngữ phải là 'en' hoặc 'vi'")
        return v


class SpellCheckResponse(BaseModel):
    """Mô hình phản hồi kiểm tra chính tả."""
    errors: List[Dict[str, Any]] = Field(default_factory=list)
    feature_enabled: bool
    audit_id: Optional[str] = None
    total_errors: int = 0


class GrammarCheckRequest(BaseModel):
    """Mô hình yêu cầu kiểm tra ngữ pháp."""
    text: str = Field(..., min_length=1, max_length=10000, description="Văn bản cần kiểm tra")
    language: str = Field("en", description="Mã ngôn ngữ: 'en' hoặc 'vi'")
    conference_id: str = Field(..., description="Mã hội nghị")
    user_id: Optional[str] = Field(None, description="Mã người dùng")
    
    @validator('language')
    def validate_language(cls, v):
        if v not in ['en', 'vi']:
            raise ValueError("Ngôn ngữ phải là 'en' hoặc 'vi'")
        return v


class GrammarCheckResponse(BaseModel):
    """Mô hình phản hồi kiểm tra ngữ pháp."""
    errors: List[Dict[str, Any]] = Field(default_factory=list)
    suggestions_count: int = 0
    feature_enabled: bool
    audit_id: Optional[str] = None


class PolishAbstractRequest(BaseModel):
    """Mô hình yêu cầu đánh bóng tóm tắt."""
    abstract: str = Field(..., min_length=1, max_length=2000, description="Văn bản tóm tắt")
    language: str = Field("en", description="Mã ngôn ngữ: 'en' hoặc 'vi'")
    conference_id: str = Field(..., description="Mã hội nghị")
    paper_id: Optional[str] = Field(None, description="Mã bài báo")
    user_id: Optional[str] = Field(None, description="Mã người dùng")
    preserve_meaning: bool = Field(True, description="Giữ nguyên ý nghĩa gốc")
    enhance_tone: bool = Field(True, description="Nâng cao giọng văn học thuật")
    
    @validator('language')
    def validate_language(cls, v):
        if v not in ['en', 'vi']:
            raise ValueError("Ngôn ngữ phải là 'en' hoặc 'vi'")
        return v


class PolishAbstractResponse(BaseModel):
    """Mô hình phản hồi đánh bóng tóm tắt."""
    original: str
    polished: str
    changes: List[Dict[str, Any]] = Field(default_factory=list)
    rationale: str
    preview_mode: bool = True
    feature_enabled: bool
    audit_id: Optional[str] = None
    confidence_score: Optional[float] = None


class SuggestKeywordsRequest(BaseModel):
    """Mô hình yêu cầu gợi ý từ khóa."""
    title: str = Field(..., min_length=1, max_length=500, description="Tiêu đề bài báo")
    abstract: str = Field(..., min_length=1, max_length=2000, description="Tóm tắt bài báo")
    language: str = Field("en", description="Mã ngôn ngữ: 'en' hoặc 'vi'")
    conference_id: str = Field(..., description="Mã hội nghị")
    max_keywords: int = Field(5, ge=1, le=10, description="Số từ khóa tối đa")
    user_id: Optional[str] = Field(None, description="Mã người dùng")
    
    @validator('language')
    def validate_language(cls, v):
        if v not in ['en', 'vi']:
            raise ValueError("Ngôn ngữ phải là 'en' hoặc 'vi'")
        return v


class SuggestKeywordsResponse(BaseModel):
    """Mô hình phản hồi gợi ý từ khóa."""
    keywords: List[Dict[str, Any]] = Field(default_factory=list)
    max_keywords: int = 5
    feature_enabled: bool
    audit_id: Optional[str] = None


class ApplyPolishRequest(BaseModel):
    """Mô hình yêu cầu áp dụng tóm tắt đã đánh bóng."""
    paper_id: str = Field(..., description="Mã bài báo")
    polished_abstract: str = Field(..., min_length=1, max_length=2000, description="Tóm tắt đã đánh bóng")
    user_confirmed: bool = Field(True, description="Xác nhận của người dùng")
    user_id: str = Field(..., description="Mã người dùng")
    conference_id: str = Field(..., description="Mã hội nghị")


class ApplyPolishResponse(BaseModel):
    """Mô hình phản hồi áp dụng tóm tắt đã đánh bóng."""
    success: bool
    audit_logged: bool
    message: str


# ============================================
# Hàm hỗ trợ
# ============================================

def _convert_spelling_error(error: SpellingError) -> Dict[str, Any]:
    """Chuyển đổi SpellingError thành dictionary."""
    return {
        "word": error.word,
        "position": error.position,
        "suggestions": error.suggestions,
        "context": error.context
    }


def _convert_grammar_error(error: GrammarError) -> Dict[str, Any]:
    """Chuyển đổi GrammarError thành dictionary."""
    return {
        "error_type": error.error_type,
        "position": error.position,
        "original": error.original,
        "suggestion": error.suggestion,
        "explanation": error.explanation,
        "context": error.context
    }


def _convert_change(change) -> Dict[str, Any]:
    """Chuyển đổi Change thành dictionary."""
    return {
        "change_type": change.change_type,
        "before": change.before,
        "after": change.after,
        "position": change.position,
        "explanation": change.explanation
    }


# ============================================
# Các Điểm API
# ============================================

@router.post("/check-spelling", response_model=SpellCheckResponse)
async def check_spelling(request: SpellCheckRequest):
    """
    Kiểm tra lỗi chính tả trong văn bản.
    
    - **text**: Văn bản cần kiểm tra (tối đa 10000 ký tự)
    - **language**: Mã ngôn ngữ ("en" hoặc "vi")
    - **conference_id**: Mã hội nghị
    - **user_id**: Mã người dùng (tùy chọn)
    """
    # Kiểm tra feature flag
    feature_manager = get_feature_flag_manager()
    feature_enabled = await feature_manager.is_enabled(
        request.conference_id,
        "spell_check"
    )
    
    if not feature_enabled:
        raise HTTPException(
            status_code=403,
            detail="Spell check feature is not enabled for this conference"
        )
    
    try:
        # Perform spell check
        spell_checker = get_spell_checker()
        errors = await spell_checker.check_spelling(
            text=request.text,
            language=request.language
        )
        
        # Log to audit trail
        audit_logger = get_audit_logger()
        audit_id = await audit_logger.log_operation(
            conference_id=request.conference_id,
            user_id=request.user_id or "anonymous",
            feature="spell_check",
            action="check_spelling",
            prompt=request.text[:1000],  # Truncate for logging
            model_id="gpt-4o-mini",
            output_summary=f"Found {len(errors)} spelling errors",
            accepted=None  # User hasn't accepted/rejected yet
        )
        
        return SpellCheckResponse(
            errors=[_convert_spelling_error(e) for e in errors],
            feature_enabled=True,
            audit_id=audit_id,
            total_errors=len(errors)
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Spell check failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Spell check service unavailable")


@router.post("/check-grammar", response_model=GrammarCheckResponse)
async def check_grammar(request: GrammarCheckRequest):
    """
    Kiểm tra lỗi ngữ pháp trong văn bản.
    
    - **text**: Văn bản cần kiểm tra (tối đa 10000 ký tự)
    - **language**: Mã ngôn ngữ ("en" hoặc "vi")
    - **conference_id**: Mã hội nghị
    - **user_id**: Mã người dùng (tùy chọn)
    """
    # Kiểm tra feature flag
    feature_manager = get_feature_flag_manager()
    feature_enabled = await feature_manager.is_enabled(
        request.conference_id,
        "grammar_check"
    )
    
    if not feature_enabled:
        raise HTTPException(
            status_code=403,
            detail="Tính năng kiểm tra ngữ pháp chưa được kích hoạt cho hội nghị này"
        )
    
    try:
        # Thực hiện kiểm tra ngữ pháp
        grammar_checker = get_grammar_checker()
        errors = await grammar_checker.check_grammar(
            text=request.text,
            language=request.language
        )
        
        # Ghi log kiểm toán
        audit_logger = get_audit_logger()
        audit_id = await audit_logger.log_operation(
            conference_id=request.conference_id,
            user_id=request.user_id or "anonymous",
            feature="grammar_check",
            action="check_grammar",
            prompt=request.text[:1000],
            model_id="gpt-4o-mini",
            output_summary=f"Tìm thấy {len(errors)} lỗi ngữ pháp",
            accepted=None
        )
        
        return GrammarCheckResponse(
            errors=[_convert_grammar_error(e) for e in errors],
            suggestions_count=len(errors),
            feature_enabled=True,
            audit_id=audit_id
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Kiểm tra ngữ pháp thất bại: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Dịch vụ kiểm tra ngữ pháp không khả dụng")


@router.post("/polish-abstract", response_model=PolishAbstractResponse)
async def polish_abstract(request: PolishAbstractRequest):
    """
    Đánh bóng tóm tắt để cải thiện độ rõ ràng và giọng văn học thuật.
    
    - **abstract**: Văn bản tóm tắt (tối đa 2000 ký tự)
    - **language**: Mã ngôn ngữ ("en" hoặc "vi")
    - **conference_id**: Mã hội nghị
    - **paper_id**: Mã bài báo (tùy chọn)
    - **preserve_meaning**: Giữ nguyên ý nghĩa gốc hay không
    - **enhance_tone**: Nâng cao giọng văn học thuật hay không
    """
    # Kiểm tra feature flag
    feature_manager = get_feature_flag_manager()
    feature_enabled = await feature_manager.is_enabled(
        request.conference_id,
        "abstract_polish"
    )
    
    if not feature_enabled:
        raise HTTPException(
            status_code=403,
            detail="Tính năng đánh bóng tóm tắt chưa được kích hoạt cho hội nghị này"
        )
    
    try:
        # Đánh bóng tóm tắt
        polisher = get_abstract_polisher()
        result = await polisher.polish_abstract(
            text=request.abstract,
            language=request.language,
            preserve_meaning=request.preserve_meaning,
            enhance_tone=request.enhance_tone
        )
        
        # Ghi log kiểm toán
        audit_logger = get_audit_logger()
        audit_id = await audit_logger.log_operation(
            conference_id=request.conference_id,
            user_id=request.user_id or "anonymous",
            feature="abstract_polish",
            action="polish_abstract",
            prompt=request.abstract[:1000],
            model_id="gpt-4o-mini",
            output_summary=f"Đã đánh bóng tóm tắt với {len(result.changes)} thay đổi. Lý do: {result.rationale[:200]}",
            accepted=None  # Người dùng chưa chấp nhận
        )
        
        return PolishAbstractResponse(
            original=result.original,
            polished=result.polished,
            changes=[_convert_change(c) for c in result.changes],
            rationale=result.rationale,
            preview_mode=True,  # Luôn ở chế độ xem trước - người dùng phải xác nhận
            feature_enabled=True,
            audit_id=audit_id,
            confidence_score=result.confidence_score
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Đánh bóng tóm tắt thất bại: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Dịch vụ đánh bóng tóm tắt không khả dụng")


@router.post("/suggest-keywords", response_model=SuggestKeywordsResponse)
async def suggest_keywords(request: SuggestKeywordsRequest):
    """
    Gợi ý từ khóa dựa trên tiêu đề và tóm tắt.
    
    - **title**: Tiêu đề bài báo (tối đa 500 ký tự)
    - **abstract**: Tóm tắt bài báo (tối đa 2000 ký tự)
    - **language**: Mã ngôn ngữ ("en" hoặc "vi")
    - **conference_id**: Mã hội nghị
    - **max_keywords**: Số từ khóa tối đa (1-10)
    """
    # Kiểm tra feature flag
    feature_manager = get_feature_flag_manager()
    feature_enabled = await feature_manager.is_enabled(
        request.conference_id,
        "keyword_suggest"
    )
    
    if not feature_enabled:
        raise HTTPException(
            status_code=403,
            detail="Tính năng gợi ý từ khóa chưa được kích hoạt cho hội nghị này"
        )
    
    try:
        # Gợi ý từ khóa
        suggester = get_keyword_suggester()
        keywords = await suggester.suggest_keywords(
            title=request.title,
            abstract=request.abstract,
            language=request.language,
            max_keywords=request.max_keywords
        )
        
        # Ghi log kiểm toán
        audit_logger = get_audit_logger()
        audit_id = await audit_logger.log_operation(
            conference_id=request.conference_id,
            user_id=request.user_id or "anonymous",
            feature="keyword_suggest",
            action="suggest_keywords",
            prompt=f"Tiêu đề: {request.title[:500]}\nTóm tắt: {request.abstract[:500]}",
            model_id="gpt-4o-mini",
            output_summary=f"Đã gợi ý {len(keywords)} từ khóa",
            accepted=None
        )
        
        return SuggestKeywordsResponse(
            keywords=[
                {
                    "keyword": kw.keyword,
                    "score": kw.score,
                    "reason": kw.reason,
                    "category": kw.category
                }
                for kw in keywords
            ],
            max_keywords=request.max_keywords,
            feature_enabled=True,
            audit_id=audit_id
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Gợi ý từ khóa thất bại: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Dịch vụ gợi ý từ khóa không khả dụng")


@router.post("/apply-polish", response_model=ApplyPolishResponse)
async def apply_polish(request: ApplyPolishRequest):
    """
    Áp dụng tóm tắt đã đánh bóng (yêu cầu xác nhận của người dùng).
    
    - **paper_id**: Mã bài báo
    - **polished_abstract**: Văn bản tóm tắt đã đánh bóng
    - **user_confirmed**: Xác nhận của người dùng (phải là true)
    - **user_id**: Mã người dùng
    - **conference_id**: Mã hội nghị
    
    Lưu ý: Endpoint này chỉ ghi lại việc chấp nhận. Việc cập nhật bài báo thực sự
    nên được thực hiện thông qua dịch vụ backend.
    """
    if not request.user_confirmed:
        raise HTTPException(
            status_code=400,
            detail="Yêu cầu xác nhận của người dùng để áp dụng tóm tắt đã đánh bóng"
        )
    
    try:
        # Ghi log chấp nhận vào bảng kiểm toán
        audit_logger = get_audit_logger()
        audit_id = await audit_logger.log_operation(
            conference_id=request.conference_id,
            user_id=request.user_id,
            feature="abstract_polish",
            action="apply_polish",
            prompt=f"Mã bài báo: {request.paper_id}",
            model_id="system",
            output_summary=f"Người dùng đã chấp nhận tóm tắt đánh bóng cho bài báo {request.paper_id}",
            accepted=True  # Người dùng đã xác nhận
        )
        
        return ApplyPolishResponse(
            success=True,
            audit_logged=True,
            message=f"Tóm tắt đã đánh bóng được chấp nhận và ghi lại. Việc cập nhật bài báo nên được thực hiện thông qua API backend."
        )
        
    except Exception as e:
        logger.error(f"Áp dụng đánh bóng thất bại: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Không thể ghi lại việc áp dụng đánh bóng")


