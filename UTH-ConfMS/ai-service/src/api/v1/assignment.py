"""
API Endpoints Tính Năng AI Phân Công
Cung cấp tính toán độ tương đồng phản biện-bài báo và gợi ý phân công.
"""
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Optional
from pydantic import BaseModel, Field
from core.services.similarity_calculator import get_similarity_calculator
from core.services.assignment_suggester import (
    get_assignment_suggester,
    AssignmentConstraints
)
from core.governance.feature_flags import get_feature_flag_manager
from core.governance.audit_logger import get_audit_logger
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================
# Mô hình Request/Response
# ============================================

class CalculateSimilarityRequest(BaseModel):
    """Mô hình yêu cầu tính toán độ tương đồng."""
    paper_id: str = Field(..., description="Paper ID")
    paper_title: str = Field(..., description="Paper title")
    paper_abstract: str = Field(..., description="Paper abstract")
    paper_keywords: List[str] = Field(default_factory=list, description="Paper keywords")
    reviewer_ids: List[str] = Field(..., description="Candidate reviewer IDs")
    reviewer_data: Dict[str, Dict] = Field(..., description="Reviewer data: {reviewer_id: {expertise_keywords: [...], past_abstracts: [...]}}")
    conference_id: str = Field(..., description="Conference ID")
    user_id: Optional[str] = Field(None, description="User ID (chair)")


class SimilarityMatchResponse(BaseModel):
    """Mô hình phản hồi khớp độ tương đồng."""
    reviewer_id: str
    similarity_score: float
    matching_keywords: List[str]
    common_topics: List[str]
    expertise_match: str
    rationale: str


class CalculateSimilarityResponse(BaseModel):
    """Mô hình phản hồi tính toán độ tương đồng."""
    matches: List[SimilarityMatchResponse]
    ranked_by: str = "similarity_score"
    paper_id: str


class SuggestAssignmentsRequest(BaseModel):
    """Mô hình yêu cầu gợi ý phân công."""
    conference_id: str = Field(..., description="Conference ID")
    paper_ids: List[str] = Field(..., description="Paper IDs")
    paper_data: Dict[str, Dict] = Field(..., description="Paper data: {paper_id: {title, abstract, keywords}}")
    reviewer_ids: List[str] = Field(..., description="Reviewer IDs")
    reviewer_data: Dict[str, Dict] = Field(..., description="Reviewer data")
    constraints: Dict = Field(..., description="Assignment constraints")
    existing_assignments: Optional[List[Dict]] = Field(default_factory=list, description="Existing assignments")
    user_id: Optional[str] = Field(None, description="User ID (chair)")


class AssignmentSuggestionResponse(BaseModel):
    """Mô hình phản hồi gợi ý phân công."""
    paper_id: str
    reviewer_id: str
    score: float
    rationale: str


class SuggestAssignmentsResponse(BaseModel):
    """Mô hình phản hồi gợi ý phân công."""
    suggested_assignments: List[AssignmentSuggestionResponse]
    unassigned_papers: List[str]
    overloaded_reviewers: List[str]
    rationale: str


# ============================================
# API Endpoints
# ============================================

@router.post("/calculate-similarity", response_model=CalculateSimilarityResponse)
async def calculate_similarity(request: CalculateSimilarityRequest):
    """
    Tính toán độ tương đồng giữa một bài báo và nhiều phản biện.
    
    - **paper_id**: Mã bài báo
    - **paper_title**: Tiêu đề bài báo
    - **paper_abstract**: Tóm tắt bài báo
    - **paper_keywords**: Từ khóa bài báo
    - **reviewer_ids**: Mã phản biện ứng viên
    - **reviewer_data**: Dữ liệu chuyên môn phản biện
    - **conference_id**: Mã hội nghị
    """
    # Kiểm tra feature flag
    feature_manager = get_feature_flag_manager()
    feature_enabled = await feature_manager.is_enabled(
        request.conference_id,
        "reviewer_similarity"
    )
    
    if not feature_enabled:
        raise HTTPException(
            status_code=403,
            detail="Tính năng tương đồng phản biện chưa được bật cho hội nghị này"
        )
    
    try:
        calculator = get_similarity_calculator()
        
        # Xếp hạng phản biện cho bài báo
        matches = await calculator.rank_reviewers_for_paper(
            paper_id=request.paper_id,
            paper_title=request.paper_title,
            paper_abstract=request.paper_abstract,
            paper_keywords=request.paper_keywords,
            candidate_reviewer_ids=request.reviewer_ids,
            reviewer_data=request.reviewer_data
        )
        
        # Ghi vào nhật ký kiểm toán
        audit_logger = get_audit_logger()
        await audit_logger.log_operation(
            conference_id=request.conference_id,
            user_id=request.user_id or "anonymous",
            feature="reviewer_similarity",
            action="calculate_similarity",
            prompt=f"Paper: {request.paper_id}, Reviewers: {len(request.reviewer_ids)}",
            model_id="embedding",
            output_summary=f"Calculated similarity for {len(matches)} reviewers",
            accepted=None
        )
        
        return CalculateSimilarityResponse(
            matches=[
                SimilarityMatchResponse(
                    reviewer_id=m.reviewer_id,
                    similarity_score=m.similarity_score,
                    matching_keywords=m.matching_keywords,
                    common_topics=m.common_topics,
                    expertise_match=m.expertise_match,
                    rationale=m.rationale
                )
                for m in matches
            ],
            ranked_by="similarity_score",
            paper_id=request.paper_id
        )
        
    except Exception as e:
        logger.error(f"Tính toán độ tương đồng thất bại: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Dịch vụ tính toán độ tương đồng không khả dụng")


@router.post("/suggest-assignments", response_model=SuggestAssignmentsResponse)
async def suggest_assignments(request: SuggestAssignmentsRequest):
    """
    Gợi ý phân công phản biện-bài báo với ràng buộc.
    
    - **conference_id**: Mã hội nghị
    - **paper_ids**: Danh sách mã bài báo
    - **paper_data**: Dữ liệu metadata bài báo
    - **reviewer_ids**: Danh sách mã phản biện
    - **reviewer_data**: Dữ liệu metadata phản biện
    - **constraints**: Ràng buộc phân công
    - **existing_assignments**: Phân công hiện tại cần xét đến
    """
    # Kiểm tra feature flag
    feature_manager = get_feature_flag_manager()
    feature_enabled = await feature_manager.is_enabled(
        request.conference_id,
        "reviewer_similarity"
    )
    
    if not feature_enabled:
        raise HTTPException(
            status_code=403,
            detail="Tính năng gợi ý phân công chưa được bật cho hội nghị này"
        )
    
    try:
        # Phân tích ràng buộc
        constraints = AssignmentConstraints(
            max_papers_per_reviewer=request.constraints.get("max_papers_per_reviewer", 5),
            min_reviewers_per_paper=request.constraints.get("min_reviewers_per_paper", 3),
            coi_exclusions=request.constraints.get("coi_exclusions", []),
            workload_balance=request.constraints.get("workload_balance", True)
        )
        
        suggester = get_assignment_suggester()
        result = await suggester.suggest_assignments(
            paper_ids=request.paper_ids,
            paper_data=request.paper_data,
            reviewer_ids=request.reviewer_ids,
            reviewer_data=request.reviewer_data,
            constraints=constraints,
            existing_assignments=request.existing_assignments
        )
        
        # Ghi vào nhật ký kiểm toán
        audit_logger = get_audit_logger()
        await audit_logger.log_operation(
            conference_id=request.conference_id,
            user_id=request.user_id or "anonymous",
            feature="reviewer_similarity",
            action="suggest_assignments",
            prompt=f"Papers: {len(request.paper_ids)}, Reviewers: {len(request.reviewer_ids)}",
            model_id="assignment_suggester",
            output_summary=f"Suggested {len(result.suggested_assignments)} assignments",
            accepted=None
        )
        
        return SuggestAssignmentsResponse(
            suggested_assignments=[
                AssignmentSuggestionResponse(
                    paper_id=a.paper_id,
                    reviewer_id=a.reviewer_id,
                    score=a.score,
                    rationale=a.rationale
                )
                for a in result.suggested_assignments
            ],
            unassigned_papers=result.unassigned_papers,
            overloaded_reviewers=result.overloaded_reviewers,
            rationale=result.rationale
        )
        
    except Exception as e:
        logger.error(f"Gợi ý phân công thất bại: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Dịch vụ gợi ý phân công không khả dụng")


