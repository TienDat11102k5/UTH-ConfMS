"""
Dịch vụ Gợi ý Phân Công
Gợi ý phân công người phản biện-bài báo với các ràng buộc và kiểm tra xung đột lợi ích (COI).
"""
import logging
from typing import List, Dict, Optional, Set
from dataclasses import dataclass
from core.services.similarity_calculator import get_similarity_calculator, Match

logger = logging.getLogger(__name__)


@dataclass
class Assignment:
    """Đại diện cho một phân công được đề xuất."""
    paper_id: str
    reviewer_id: str
    score: float
    rationale: str


@dataclass
class AssignmentConstraints:
    """Ràng buộc cho các đề xuất phân công."""
    max_papers_per_reviewer: int = 5
    min_reviewers_per_paper: int = 3
    coi_exclusions: List[Dict[str, str]] = None  # [{"paper_id": "...", "reviewer_id": "..."}]
    workload_balance: bool = True


@dataclass
class AssignmentResult:
    """Kết quả của đề xuất phân công."""
    suggested_assignments: List[Assignment]
    unassigned_papers: List[str]
    overloaded_reviewers: List[str]
    rationale: str


class AssignmentSuggester:
    """
    Suggests reviewer-paper assignments using weighted bipartite matching.
    """
    
    def __init__(self):
        self.similarity_calculator = get_similarity_calculator()
    
    async def suggest_assignments(
        self,
        paper_ids: List[str],
        paper_data: Dict[str, Dict],  # {paper_id: {title, abstract, keywords}}
        reviewer_ids: List[str],
        reviewer_data: Dict[str, Dict],  # {reviewer_id: {expertise_keywords, past_abstracts}}
        constraints: AssignmentConstraints,
        existing_assignments: Optional[List[Dict]] = None  # Existing assignments to consider
    ) -> AssignmentResult:
        """
        Suggest assignments with constraints.
        
        Args:
            paper_ids: List of paper IDs
            paper_data: Paper metadata
            reviewer_ids: List of reviewer IDs
            reviewer_data: Reviewer metadata
            constraints: Assignment constraints
            existing_assignments: Existing assignments to consider for workload
            
        Returns:
            AssignmentResult with suggested assignments
        """
        # Build COI exclusion set
        coi_set = set()
        if constraints.coi_exclusions:
            for coi in constraints.coi_exclusions:
                key = (coi.get("paper_id"), coi.get("reviewer_id"))
                coi_set.add(key)
        
        # Calculate similarity scores for all paper-reviewer pairs
        all_matches = []
        
        for paper_id in paper_ids:
            if paper_id not in paper_data:
                logger.warning(f"Paper data not found for {paper_id}")
                continue
            
            paper_info = paper_data[paper_id]
            
            # Rank reviewers for this paper
            matches = await self.similarity_calculator.rank_reviewers_for_paper(
                paper_id=paper_id,
                paper_title=paper_info.get("title", ""),
                paper_abstract=paper_info.get("abstract", ""),
                paper_keywords=paper_info.get("keywords", []),
                candidate_reviewer_ids=reviewer_ids,
                reviewer_data=reviewer_data
            )
            
            # Filter out COI matches
            filtered_matches = [
                m for m in matches
                if (paper_id, m.reviewer_id) not in coi_set
            ]
            
            all_matches.extend([
                {
                    "paper_id": paper_id,
                    "reviewer_id": m.reviewer_id,
                    "score": m.similarity_score,
                    "rationale": m.rationale
                }
                for m in filtered_matches
            ])
        
        # Tính khối lượng công việc hiện tại
        reviewer_workload = self._calculate_workload(
            reviewer_ids,
            existing_assignments or []
        )
        
        # Phân công tham lam với ràng buộc
        suggested_assignments = []
        paper_assignments = {pid: [] for pid in paper_ids}
        reviewer_assignments = {rid: [] for rid in reviewer_ids}
        
        # Sắp xếp tất cả khớp theo điểm giảm dần
        all_matches.sort(key=lambda x: x["score"], reverse=True)
        
        for match in all_matches:
            paper_id = match["paper_id"]
            reviewer_id = match["reviewer_id"]
            
            # Kiểm tra ràng buộc
            if len(paper_assignments[paper_id]) >= constraints.min_reviewers_per_paper:
                continue  # Bài báo đã đủ người phản biện
            
            current_workload = len(reviewer_assignments[reviewer_id])
            if current_workload >= constraints.max_papers_per_reviewer:
                continue  # Người phản biện đã đạt số lượng tối đa
            
            # Thêm phân công
            assignment = Assignment(
                paper_id=paper_id,
                reviewer_id=reviewer_id,
                score=match["score"],
                rationale=match["rationale"]
            )
            
            suggested_assignments.append(assignment)
            paper_assignments[paper_id].append(reviewer_id)
            reviewer_assignments[reviewer_id].append(paper_id)
        
        # Tìm các bài báo chưa được phân công
        unassigned_papers = [
            pid for pid in paper_ids
            if len(paper_assignments[pid]) < constraints.min_reviewers_per_paper
        ]
        
        # Tìm người phản biện quá tải (nếu bật cân bằng khối lượng)
        overloaded_reviewers = []
        if constraints.workload_balance:
            avg_workload = sum(len(assignments) for assignments in reviewer_assignments.values()) / max(len(reviewer_ids), 1)
            overloaded_reviewers = [
                rid for rid, assignments in reviewer_assignments.items()
                if len(assignments) > avg_workload * 1.5
            ]
        
        rationale = self._generate_rationale(
            len(suggested_assignments),
            len(unassigned_papers),
            constraints
        )
        
        return AssignmentResult(
            suggested_assignments=suggested_assignments,
            unassigned_papers=unassigned_papers,
            overloaded_reviewers=overloaded_reviewers,
            rationale=rationale
        )
    
    def _calculate_workload(
        self,
        reviewer_ids: List[str],
        existing_assignments: List[Dict]
    ) -> Dict[str, int]:
        """Tính khối lượng công việc hiện tại cho mỗi người phản biện."""
        workload = {rid: 0 for rid in reviewer_ids}
        
        for assignment in existing_assignments:
            reviewer_id = assignment.get("reviewer_id")
            if reviewer_id in workload:
                workload[reviewer_id] += 1
        
        return workload
    
    def _generate_rationale(
        self,
        num_assignments: int,
        num_unassigned: int,
        constraints: AssignmentConstraints
    ) -> str:
        """Tạo lý do giải thích cho các đề xuất phân công."""
        parts = [
            f"Đã đề xuất {num_assignments} phân công",
            f"Tối đa {constraints.max_papers_per_reviewer} bài báo mỗi người phản biện",
            f"Tối thiểu {constraints.min_reviewers_per_paper} người phản biện mỗi bài báo"
        ]
        
        if num_unassigned > 0:
            parts.append(f"{num_unassigned} bài báo cần thêm người phản biện")
        
        return ". ".join(parts)


# Global instance
_assignment_suggester: Optional[AssignmentSuggester] = None


def get_assignment_suggester() -> AssignmentSuggester:
    """Lấy hoặc tạo instance global AssignmentSuggester."""
    global _assignment_suggester
    if _assignment_suggester is None:
        _assignment_suggester = AssignmentSuggester()
    return _assignment_suggester


