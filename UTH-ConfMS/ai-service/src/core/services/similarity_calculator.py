"""
Dịch vụ Tính toán Độ Tương đồng
Tính toán độ tương đồng giữa bài báo và người phản biện để đề xuất phân công.
"""
import logging
from typing import List, Dict, Optional
from dataclasses import dataclass
from core.services.embedding_service import get_embedding_service
from core.governance.model_manager import get_model_manager
from core.infra.config import get_settings

logger = logging.getLogger(__name__)


@dataclass
class SimilarityScore:
    """Đại diện cho điểm độ tương đồng giữa bài báo và người phản biện."""
    reviewer_id: str
    similarity_score: float  # 0.0-1.0
    matching_keywords: List[str]
    common_topics: List[str]
    expertise_match: str  # "high", "medium", "low"
    rationale: str


@dataclass
class Match:
    """Đại diện cho một cặp khớp giữa bài báo và người phản biện."""
    reviewer_id: str
    similarity_score: float
    matching_keywords: List[str]
    common_topics: List[str]
    expertise_match: str
    rationale: str
    confidence: float  # 0.0-1.0


class SimilarityCalculator:
    """
    Tính toán độ tương đồng giữa bài báo và người phản biện sử dụng embeddings và khớp từ khóa.
    """
    
    def __init__(self):
        self.embedding_service = get_embedding_service()
        self.model_manager = get_model_manager()
    
    async def calculate_similarity(
        self,
        paper_id: str,
        paper_title: str,
        paper_abstract: str,
        paper_keywords: List[str],
        reviewer_id: str,
        reviewer_expertise_keywords: List[str],
        reviewer_past_abstracts: Optional[List[str]] = None
    ) -> SimilarityScore:
        """
        Tính toán độ tương đồng giữa một bài báo và người phản biện.
        
        Args:
            paper_id: ID bài báo
            paper_title: Tiêu đề bài báo
            paper_abstract: Tóm tắt bài báo
            paper_keywords: Từ khóa bài báo
            reviewer_id: ID người phản biện
            reviewer_expertise_keywords: Từ khóa chuyên môn của người phản biện
            reviewer_past_abstracts: Danh sách tùy chọn các tóm tắt bài báo trước của người phản biện
            
        Returns:
            Đối tượng SimilarityScore
        """
        try:
            # Kết hợp văn bản bài báo để tạo embedding
            paper_text = f"{paper_title}\n\n{paper_abstract}"
            if paper_keywords:
                paper_text += f"\n\nTừ khóa: {', '.join(paper_keywords)}"
            
            # Kết hợp văn bản người phản biện để tạo embedding
            reviewer_text = f"Chuyên môn: {', '.join(reviewer_expertise_keywords)}"
            if reviewer_past_abstracts:
                reviewer_text += f"\n\nCông trình trước:\n" + "\n\n".join(reviewer_past_abstracts[:3])  # Giới hạn 3 bài
            
            # Tạo embeddings
            paper_embedding = await self.embedding_service.generate_embedding(paper_text)
            reviewer_embedding = await self.embedding_service.generate_embedding(reviewer_text)
            
            # Tính độ tương đồng cosine
            embedding_similarity = self.embedding_service.calculate_cosine_similarity(
                paper_embedding,
                reviewer_embedding
            )
            
            # Khớp từ khóa
            matching_keywords = self._find_matching_keywords(
                paper_keywords,
                reviewer_expertise_keywords
            )
            
            # Tính độ tương đồng dựa trên từ khóa
            keyword_similarity = len(matching_keywords) / max(len(paper_keywords), 1) if paper_keywords else 0.0
            
            # Độ tương đồng tổng hợp (có trọng số)
            combined_similarity = (0.7 * embedding_similarity) + (0.3 * keyword_similarity)
            
            # Xác định mức độ khớp chuyên môn
            if combined_similarity >= 0.8:
                expertise_match = "high"
            elif combined_similarity >= 0.6:
                expertise_match = "medium"
            else:
                expertise_match = "low"
            
            # Trích xuất các chủ đề chung bằng LLM
            common_topics = await self._extract_common_topics(
                paper_abstract,
                reviewer_expertise_keywords
            )
            
            # Tạo lý do giải thích
            rationale = self._generate_rationale(
                combined_similarity,
                matching_keywords,
                common_topics,
                expertise_match
            )
            
            return SimilarityScore(
                reviewer_id=reviewer_id,
                similarity_score=round(combined_similarity, 3),
                matching_keywords=matching_keywords,
                common_topics=common_topics,
                expertise_match=expertise_match,
                rationale=rationale
            )
            
        except Exception as e:
            logger.error(f"Tính toán độ tương đồng thất bại: {e}", exc_info=True)
            raise
    
    def _find_matching_keywords(
        self,
        paper_keywords: List[str],
        reviewer_keywords: List[str]
    ) -> List[str]:
        """Tìm các từ khóa khớp giữa bài báo và người phản biện."""
        paper_lower = [kw.lower().strip() for kw in paper_keywords]
        reviewer_lower = [kw.lower().strip() for kw in reviewer_keywords]
        
        matches = []
        for pk in paper_lower:
            for rk in reviewer_lower:
                # Khớp chính xác hoặc khớp chuỗi con
                if pk == rk or pk in rk or rk in pk:
                    if pk not in matches:
                        matches.append(pk)
        
        return matches
    
    async def _extract_common_topics(
        self,
        paper_abstract: str,
        reviewer_keywords: List[str]
    ) -> List[str]:
        """Trích xuất các chủ đề chung giữa bài báo và chuyên môn của người phản biện."""
        try:
            prompt = f"""Trích xuất các chủ đề nghiên cứu chung giữa tóm tắt bài báo này và chuyên môn của người phản biện.

Tóm tắt bài báo: {paper_abstract[:500]}

Từ khóa chuyên môn của người phản biện: {', '.join(reviewer_keywords)}

Trả về mảng JSON các chủ đề chung (tối đa 5 chủ đề):
["chủ đề 1", "chủ đề 2", ...]

Chỉ trả về mảng JSON, không có markdown."""
            
            response = await self.model_manager.call_llm(
                prompt=prompt,
                system_instruction="Bạn là chuyên gia xác định sự trùng lặp chủ đề nghiên cứu.",
                model=get_settings().model_name,
                temperature=0.2
            )
            
            import json
            json_str = response.strip()
            if json_str.startswith("```json"):
                json_str = json_str[7:]
            if json_str.startswith("```"):
                json_str = json_str[3:]
            if json_str.endswith("```"):
                json_str = json_str[:-3]
            json_str = json_str.strip()
            
            topics = json.loads(json_str)
            return topics if isinstance(topics, list) else []
            
        except Exception as e:
            logger.warning(f"Trích xuất chủ đề chung thất bại: {e}")
            return []
    
    def _generate_rationale(
        self,
        similarity: float,
        matching_keywords: List[str],
        common_topics: List[str],
        expertise_match: str
    ) -> str:
        """Tạo lý do giải thích dễ hiểu cho điểm độ tương đồng."""
        parts = []
        
        if matching_keywords:
            parts.append(f"Từ khóa khớp: {', '.join(matching_keywords[:3])}")
        
        if common_topics:
            parts.append(f"Chủ đề chung: {', '.join(common_topics[:3])}")
        
        if expertise_match == "high":
            parts.append("Chuyên môn khớp cao")
        elif expertise_match == "medium":
            parts.append("Chuyên môn khớp trung bình")
        else:
            parts.append("Chuyên môn khớp hạn chế")
        
        return ". ".join(parts) if parts else f"Điểm độ tương đồng: {similarity:.2f}"
    
    async def rank_reviewers_for_paper(
        self,
        paper_id: str,
        paper_title: str,
        paper_abstract: str,
        paper_keywords: List[str],
        candidate_reviewer_ids: List[str],
        reviewer_data: Dict[str, Dict]  # {reviewer_id: {expertise_keywords: [...], past_abstracts: [...]}}
    ) -> List[Match]:
        """
        Xếp hạng người phản biện cho một bài báo theo độ tương đồng.
        
        Args:
            paper_id: ID bài báo
            paper_title: Tiêu đề bài báo
            paper_abstract: Tóm tắt bài báo
            paper_keywords: Từ khóa bài báo
            candidate_reviewer_ids: Danh sách ID người phản biện ứng viên
            reviewer_data: Dictionary ánh xạ reviewer_id tới dữ liệu của họ
            
        Returns:
            Danh sách các đối tượng Match được sắp xếp theo điểm độ tương đồng (giảm dần)
        """
        matches = []
        
        for reviewer_id in candidate_reviewer_ids:
            if reviewer_id not in reviewer_data:
                logger.warning(f"Không tìm thấy dữ liệu người phản biện cho {reviewer_id}")
                continue
            
            reviewer_info = reviewer_data[reviewer_id]
            
            try:
                similarity = await self.calculate_similarity(
                    paper_id=paper_id,
                    paper_title=paper_title,
                    paper_abstract=paper_abstract,
                    paper_keywords=paper_keywords,
                    reviewer_id=reviewer_id,
                    reviewer_expertise_keywords=reviewer_info.get("expertise_keywords", []),
                    reviewer_past_abstracts=reviewer_info.get("past_abstracts", [])
                )
                
                matches.append(Match(
                    reviewer_id=similarity.reviewer_id,
                    similarity_score=similarity.similarity_score,
                    matching_keywords=similarity.matching_keywords,
                    common_topics=similarity.common_topics,
                    expertise_match=similarity.expertise_match,
                    rationale=similarity.rationale,
                    confidence=similarity.similarity_score  # Sử dụng độ tương đồng làm độ tin cậy
                ))
                
            except Exception as e:
                logger.error(f"Tính toán độ tương đồng cho người phản biện {reviewer_id} thất bại: {e}")
                continue
        
        # Sắp xếp theo điểm độ tương đồng giảm dần
        matches.sort(key=lambda m: m.similarity_score, reverse=True)
        
        return matches


# Global instance
_similarity_calculator: Optional[SimilarityCalculator] = None


def get_similarity_calculator() -> SimilarityCalculator:
    """Lấy hoặc tạo instance global SimilarityCalculator."""
    global _similarity_calculator
    if _similarity_calculator is None:
        _similarity_calculator = SimilarityCalculator()
    return _similarity_calculator



