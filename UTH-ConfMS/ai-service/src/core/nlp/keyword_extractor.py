"""
Dịch vụ Trích xuất Từ Khóa
Trích xuất và gợi ý từ khóa từ tiêu đề và tóm tắt bài báo.
"""
import logging
import re
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from core.governance.model_manager import get_model_manager
from core.infra.config import get_settings

logger = logging.getLogger(__name__)


@dataclass
class Keyword:
    """Biểu diễn một từ khóa được gợi ý."""
    keyword: str
    score: float  # Điểm liên quan 0.0-1.0
    reason: str
    category: Optional[str] = None  # "method", "domain", "application", etc.


class KeywordSuggester:
    """
    Công cụ gợi ý từ khóa sử dụng LLM và phương pháp heuristics.
    """
    
    def __init__(self):
        self.model_manager = get_model_manager()
    
    async def suggest_keywords(
        self,
        title: str,
        abstract: str,
        language: str = "en",
        max_keywords: int = 5
    ) -> List[Keyword]:
        """
        Gợi ý từ khóa dựa trên tiêu đề và tóm tắt.
        
        Tham số:
            title: Tiêu đề bài báo
            abstract: Tóm tắt bài báo
            language: Mã ngôn ngữ ("en" hoặc "vi")
            max_keywords: Số từ khóa tối đa để trả về
            
        Trả về:
            Danh sách các đối tượng Keyword được sắp xếp theo điểm liên quan
        """
        if not title and not abstract:
            raise ValueError("Title or abstract must be provided")
        
        # Kiểm tra độ dài đầu vào
        if len(title) > 500:
            raise ValueError("Title too long. Maximum 500 characters")
        if len(abstract) > 2000:
            raise ValueError("Abstract too long. Maximum 2000 characters")
        
        try:
            # Sử dụng LLM để trích xuất từ khóa thông minh
            system_instruction = self._get_keyword_system_prompt(language, max_keywords)
            prompt = self._build_keyword_prompt(title, abstract, language, max_keywords)
            
            response = await self.model_manager.call_llm(
                prompt=prompt,
                system_instruction=system_instruction,
                model=get_settings().model_name,
                temperature=0.2  # Nhiệt độ thấp cho kết quả trích xuất từ khóa ổn định
            )
            
            keywords = self._parse_keyword_response(response, max_keywords)
            
            # Xử lý sau: loại bỏ trùng lặp, kiểm tra và sắp xếp
            keywords = self._post_process_keywords(keywords, title, abstract)
            
            logger.info(f"Đã gợi ý {len(keywords)} từ khóa cho bài báo")
            
            return keywords[:max_keywords]
            
        except Exception as e:
            logger.error(f"Gợi ý từ khóa thất bại: {e}", exc_info=True)
            raise
    
    def _get_keyword_system_prompt(self, language: str, max_keywords: int) -> str:
        """Lấy system prompt cho việc trích xuất từ khóa."""
        if language == "vi":
            return f"""Bạn là một chuyên gia trích xuất từ khóa cho bài báo khoa học.
Nhiệm vụ của bạn là đề xuất {max_keywords} từ khóa phù hợp nhất dựa trên tiêu đề và abstract.

Tiêu chí:
- Từ khóa phải phản ánh nội dung chính của bài báo
- Ưu tiên các thuật ngữ kỹ thuật và chuyên ngành
- Tránh các từ quá chung chung
- Có thể là cụm từ (2-4 từ)

Trả về kết quả dưới dạng JSON array với format:
[
  {{
    "keyword": "từ khóa",
    "score": 0.95,
    "reason": "lý do đề xuất (tiếng Việt)",
    "category": "method|domain|application|technique"
  }}
]
Chỉ trả về JSON, không có markdown hay text thêm."""
        else:
            return f"""You are an expert keyword extractor for academic papers.
Your task is to suggest the {max_keywords} most relevant keywords based on the title and abstract.

Criteria:
- Keywords must reflect the main content of the paper
- Prioritize technical and domain-specific terms
- Avoid overly generic words
- Can be phrases (2-4 words)

Return results as JSON array with format:
[
  {{
    "keyword": "keyword phrase",
    "score": 0.95,
    "reason": "reason for suggestion",
    "category": "method|domain|application|technique"
  }}
]
Return only JSON, no markdown or additional text."""
    
    def _build_keyword_prompt(
        self,
        title: str,
        abstract: str,
        language: str,
        max_keywords: int
    ) -> str:
        """Xây dựng prompt cho việc trích xuất từ khóa."""
        if language == "vi":
            return f"""Hãy đề xuất {max_keywords} từ khóa phù hợp nhất cho bài báo sau:

Tiêu đề: {title}

Abstract: {abstract}

Yêu cầu:
- Từ khóa phải phản ánh nội dung chính
- Ưu tiên thuật ngữ kỹ thuật và chuyên ngành
- Sắp xếp theo độ liên quan (score cao nhất trước)
- Trả về JSON array như đã hướng dẫn"""
        else:
            return f"""Please suggest the {max_keywords} most relevant keywords for the following paper:

Title: {title}

Abstract: {abstract}

Requirements:
- Keywords must reflect main content
- Prioritize technical and domain-specific terms
- Sort by relevance (highest score first)
- Return JSON array as instructed"""
    
    def _parse_keyword_response(
        self,
        response: str,
        max_keywords: int
    ) -> List[Keyword]:
        """Phân tích phản hồi LLM thành các đối tượng Keyword."""
        import json
        
        try:
            # Thử trích xuất JSON từ phản hồi
            json_str = response.strip()
            if json_str.startswith("```json"):
                json_str = json_str[7:]
            if json_str.startswith("```"):
                json_str = json_str[3:]
            if json_str.endswith("```"):
                json_str = json_str[:-3]
            json_str = json_str.strip()
            
            keywords_data = json.loads(json_str)
            
            keywords = []
            for item in keywords_data:
                if isinstance(item, dict) and "keyword" in item:
                    keywords.append(Keyword(
                        keyword=item.get("keyword", "").strip(),
                        score=float(item.get("score", 0.5)),
                        reason=item.get("reason", "Liên quan đến nội dung bài báo"),
                        category=item.get("category")
                    ))
            
            # Sắp xếp theo điểm giảm dần
            keywords.sort(key=lambda k: k.score, reverse=True)
            
            return keywords
            
        except (json.JSONDecodeError, KeyError, TypeError, ValueError) as e:
            logger.warning(f"Không thể phân tích phản hồi từ khóa: {e}")
            logger.debug(f"Phản hồi là: {response[:500]}")
            return []
    
    def _post_process_keywords(
        self,
        keywords: List[Keyword],
        title: str,
        abstract: str
    ) -> List[Keyword]:
        """Xử lý sau từ khóa: loại bỏ trùng lặp, kiểm tra, điều chỉnh điểm."""
        # Loại bỏ trùng lặp (không phân biệt chữ hoa/thường)
        seen = set()
        unique_keywords = []
        for kw in keywords:
            key_lower = kw.keyword.lower().strip()
            if key_lower and key_lower not in seen:
                seen.add(key_lower)
                unique_keywords.append(kw)
        
        # Kiểm tra từ khóa (không quá ngắn, không quá dài)
        validated = []
        for kw in unique_keywords:
            keyword = kw.keyword.strip()
            if 2 <= len(keyword) <= 50:  # Độ dài hợp lý
                # Tăng điểm nếu từ khóa xuất hiện trong tiêu đề
                if keyword.lower() in title.lower():
                    kw.score = min(1.0, kw.score + 0.1)
                # Tăng điểm nếu từ khóa xuất hiện nhiều lần trong tóm tắt
                count = abstract.lower().count(keyword.lower())
                if count > 1:
                    kw.score = min(1.0, kw.score + 0.05 * (count - 1))
                
                validated.append(kw)
        
        # Sắp xếp lại theo điểm đã cập nhật
        validated.sort(key=lambda k: k.score, reverse=True)
        
        return validated


# Global instance
_keyword_suggester: Optional[KeywordSuggester] = None


def get_keyword_suggester() -> KeywordSuggester:
    """Lấy hoặc tạo instance KeywordSuggester toàn cục."""
    global _keyword_suggester
    if _keyword_suggester is None:
        _keyword_suggester = KeywordSuggester()
    return _keyword_suggester



