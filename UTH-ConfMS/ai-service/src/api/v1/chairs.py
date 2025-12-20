"""
API Endpoints Tính Năng AI cho Chủ tịch
Cung cấp tạo nháp email cho chủ tịch.
"""
from fastapi import APIRouter, HTTPException
from typing import Optional, List, Dict
from pydantic import BaseModel, Field
from core.services.email_generator import get_email_generator
from core.governance.feature_flags import get_feature_flag_manager
from core.governance.audit_logger import get_audit_logger
from core.infra.config import get_settings
from datetime import datetime
import logging
import uuid

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================
# Mô hình Request/Response
# ============================================

class DraftEmailRequest(BaseModel):
    """Mô hình yêu cầu tạo nháp email."""
    email_type: str = Field(..., description="Email type: accept_notification, reject_notification, reviewer_reminder")
    paper_id: Optional[str] = Field(None, description="Paper ID (for decision emails)")
    paper_title: Optional[str] = Field(None, description="Paper title")
    author_name: Optional[str] = Field(None, description="Author name")
    decision: Optional[str] = Field(None, description="Decision: accept or reject")
    reviews_summary: Optional[str] = Field(None, description="Summary of reviews")
    conference_id: str = Field(..., description="Conference ID")
    conference_name: Optional[str] = Field(None, description="Conference name")
    camera_ready_deadline: Optional[str] = Field(None, description="Camera-ready deadline")
    reviewer_id: Optional[str] = Field(None, description="Reviewer ID (for reminders)")
    reviewer_name: Optional[str] = Field(None, description="Reviewer name")
    pending_papers: Optional[List[Dict]] = Field(default_factory=list, description="Pending papers for reminder")
    language: str = Field("en", description="Language code")
    user_id: Optional[str] = Field(None, description="User ID (chair)")


class DraftEmailResponse(BaseModel):
    """Mô hình phản hồi nháp email."""
    subject: str
    body: str
    requires_review: bool = True
    draft_id: str
    template_type: str
    personalization: Dict[str, str]
    rationale: str
    generated_at: str


class ApproveEmailDraftRequest(BaseModel):
    """Mô hình yêu cầu phê duyệt nháp email."""
    draft_id: str = Field(..., description="Mã nháp")
    edited_subject: Optional[str] = Field(None, description="Tiêu đề đã chỉnh sửa")
    edited_body: Optional[str] = Field(None, description="Nội dung đã chỉnh sửa")
    approved: bool = Field(True, description="Đã phê duyệt hay chưa")
    user_id: str = Field(..., description="Mã người dùng (chủ tịch)")


class ApproveEmailDraftResponse(BaseModel):
    """Mô hình phản hồi phê duyệt nháp email."""
    success: bool
    ready_to_send: bool
    message: str


# ============================================
# API Endpoints
# ============================================

@router.post("/draft-email", response_model=DraftEmailResponse)
async def draft_email(request: DraftEmailRequest):
    """
    Tạo nháp email cho nhiều mục đích khác nhau.
    
    - **email_type**: Loại email (accept_notification, reject_notification, reviewer_reminder)
    - **paper_id**: Mã bài báo (cho email quyết định)
    - **decision**: Quyết định (accept/reject)
    - **conference_id**: Mã hội nghị
    - **language**: Mã ngôn ngữ
    """
    # Kiểm tra feature flag
    feature_manager = get_feature_flag_manager()
    feature_enabled = await feature_manager.is_enabled(
        request.conference_id,
        "email_draft_assist"
    )
    
    if not feature_enabled:
        raise HTTPException(
            status_code=403,
            detail="Tính năng tạo nháp email chưa được bật cho hội nghị này"
        )
    
    try:
        generator = get_email_generator()
        draft_id = str(uuid.uuid4())
        
        if request.email_type == "accept_notification":
            if not request.paper_id or not request.paper_title or not request.author_name:
                raise HTTPException(
                    status_code=400,
                    detail="paper_id, paper_title và author_name là bắt buộc cho accept_notification"
                )
            
            draft = await generator.draft_decision_email(
                paper_id=request.paper_id,
                paper_title=request.paper_title,
                author_name=request.author_name,
                decision="accept",
                conference_name=request.conference_name or "",
                camera_ready_deadline=request.camera_ready_deadline,
                language=request.language
            )
            
        elif request.email_type == "reject_notification":
            if not request.paper_id or not request.paper_title or not request.author_name:
                raise HTTPException(
                    status_code=400,
                    detail="paper_id, paper_title và author_name là bắt buộc cho reject_notification"
                )
            
            draft = await generator.draft_decision_email(
                paper_id=request.paper_id,
                paper_title=request.paper_title,
                author_name=request.author_name,
                decision="reject",
                reviews_summary=request.reviews_summary,
                conference_name=request.conference_name or "",
                language=request.language
            )
            
        elif request.email_type == "reviewer_reminder":
            if not request.reviewer_id or not request.reviewer_name:
                raise HTTPException(
                    status_code=400,
                    detail="reviewer_id và reviewer_name là bắt buộc cho reviewer_reminder"
                )
            
            draft = await generator.draft_reminder_email(
                reviewer_id=request.reviewer_id,
                reviewer_name=request.reviewer_name,
                pending_papers=request.pending_papers or [],
                conference_name=request.conference_name or "",
                language=request.language
            )
            
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Loại email không xác định: {request.email_type}"
            )
        
        # Ghi vào nhật ký kiểm toán
        audit_logger = get_audit_logger()
        await audit_logger.log_operation(
            conference_id=request.conference_id,
            user_id=request.user_id or "anonymous",
            feature="email_draft_assist",
            action="draft_email",
            prompt=f"Email type: {request.email_type}, Paper: {request.paper_id or 'N/A'}",
            model_id=get_settings().model_name,
            output_summary=f"Generated {request.email_type} email draft",
            accepted=None
        )
        
        return DraftEmailResponse(
            subject=draft.subject,
            body=draft.body,
            requires_review=True,  # Always requires review
            draft_id=draft_id,
            template_type=draft.template_type,
            personalization=draft.personalization,
            rationale=draft.rationale,
            generated_at=datetime.utcnow().isoformat() + "Z"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Tạo nháp email thất bại: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Dịch vụ tạo nháp email không khả dụng")


@router.put("/approve-email-draft", response_model=ApproveEmailDraftResponse)
async def approve_email_draft(request: ApproveEmailDraftRequest):
    """
    Phê duyệt nháp email (sau khi chủ tịch xem xét).
    
    - **draft_id**: Mã nháp
    - **edited_subject**: Tiêu đề đã chỉnh sửa (tùy chọn)
    - **edited_body**: Nội dung đã chỉnh sửa (tùy chọn)
    - **approved**: Đã phê duyệt hay chưa
    """
    if not request.approved:
        return ApproveEmailDraftResponse(
            success=False,
            ready_to_send=False,
            message="Nháp chưa được phê duyệt"
        )
    
    # Ghi nhật ký phê duyệt vào kiểm toán
    audit_logger = get_audit_logger()
    await audit_logger.log_operation(
        conference_id="unknown",  # Nên được truyền trong request
        user_id=request.user_id,
        feature="email_draft_assist",
        action="approve_email_draft",
        prompt=f"Mã nháp: {request.draft_id}",
        model_id="system",
        output_summary=f"Nháp email đã được phê duyệt bởi {request.user_id}",
        accepted=True
    )
    
    return ApproveEmailDraftResponse(
        success=True,
        ready_to_send=True,
        message="Nháp email đã được phê duyệt và sẵn sàng gửi"
    )



