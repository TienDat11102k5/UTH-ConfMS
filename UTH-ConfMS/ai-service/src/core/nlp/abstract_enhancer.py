"""
Dịch vụ Cải thiện Tóm tắt
Cung cấp tính năng đánh bóng và cải thiện tóm tắt cho bài báo học thuật.
"""
import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from core.governance.model_manager import get_model_manager

logger = logging.getLogger(__name__)


@dataclass
class Change:
    """Biểu diễn một thay đổi được thực hiện trong quá trình đánh bóng."""
    change_type: str  # "clarity", "grammar", "tone", "structure", "word_choice"
    before: str
    after: str
    position: Optional[int] = None
    explanation: Optional[str] = None


@dataclass
class PolishResult:
    """Kết quả của quá trình đánh bóng tóm tắt."""
    original: str
    polished: str
    changes: List[Change]
    rationale: str
    confidence_score: Optional[float] = None


class AbstractPolisher:
    """
    Công cụ đánh bóng tóm tắt sử dụng LLM để cải thiện viết học thuật.
    """
    
    def __init__(self):
        self.model_manager = get_model_manager()
    
    async def polish_abstract(
        self,
        text: str,
        language: str = "en",
        preserve_meaning: bool = True,
        enhance_tone: bool = True
    ) -> PolishResult:
        """
        Đánh bóng tóm tắt để cải thiện độ rõ ràng, giọng văn và chất lượng học thuật.
        
        Tham số:
            text: Văn bản tóm tắt cần đánh bóng
            language: Mã ngôn ngữ ("en" hoặc "vi")
            preserve_meaning: Có giữ nguyên ý nghĩa gốc chặt chẽ hay không
            enhance_tone: Có nâng cao giọng văn học thuật hay không
            
        Trả về:
            PolishResult với văn bản gốc, văn bản đã đánh bóng và các thay đổi
        """
        if not text or len(text.strip()) == 0:
            raise ValueError("Abstract text cannot be empty")
        
        # Kiểm tra độ dài đầu vào
        if len(text) > 2000:
            raise ValueError("Abstract too long. Maximum 2000 characters")
        
        try:
            system_instruction = self._get_polish_system_prompt(
                language, preserve_meaning, enhance_tone
            )
            prompt = self._build_polish_prompt(text, language)
            
            response = await self.model_manager.call_llm(
                prompt=prompt,
                system_instruction=system_instruction,
                model="gpt-4o-mini",
                temperature=0.3  # Slightly higher for more creative improvements
            )
            
            result = self._parse_polish_response(response, text, language)
            logger.info(f"Đã đánh bóng tóm tắt: {len(result.changes)} thay đổi được thực hiện")
            
            return result
            
        except Exception as e:
            logger.error(f"Đánh bóng tóm tắt thất bại: {e}", exc_info=True)
            raise
    
    def _get_polish_system_prompt(
        self,
        language: str,
        preserve_meaning: bool,
        enhance_tone: bool
    ) -> str:
        """Lấy system prompt cho việc đánh bóng tóm tắt."""
        if language == "vi":
            return f"""Bạn là một chuyên gia biên tập văn bản học thuật tiếng Việt.
Nhiệm vụ của bạn là cải thiện abstract để:
- Tăng tính rõ ràng và mạch lạc
- Nâng cao giọng văn học thuật chuyên nghiệp
- Cải thiện cấu trúc câu và từ ngữ
{"- Giữ nguyên ý nghĩa gốc (không thay đổi nội dung khoa học)" if preserve_meaning else ""}
{"- Nâng cao giọng văn học thuật" if enhance_tone else ""}

Trả về kết quả dưới dạng JSON với format:
{{
  "polished": "văn bản đã được đánh bóng",
  "changes": [
    {{
      "change_type": "clarity|grammar|tone|structure|word_choice",
      "before": "cụm từ/câu gốc",
      "after": "cụm từ/câu đã sửa",
      "position": 45,
      "explanation": "giải thích tại sao sửa"
    }}
  ],
  "rationale": "Tóm tắt các cải thiện chính (2-3 câu)",
  "confidence_score": 0.85
}}
Chỉ trả về JSON, không có markdown hay text thêm."""
        else:
            return f"""You are an expert academic text editor.
Your task is to improve the abstract to:
- Enhance clarity and coherence
- Elevate academic tone and professionalism
- Improve sentence structure and word choice
{"- Preserve original meaning (do not change scientific content)" if preserve_meaning else ""}
{"- Enhance academic tone" if enhance_tone else ""}

Return results as JSON with format:
{{
  "polished": "polished text",
  "changes": [
    {{
      "change_type": "clarity|grammar|tone|structure|word_choice",
      "before": "original phrase/sentence",
      "after": "improved phrase/sentence",
      "position": 45,
      "explanation": "explanation of why this change was made"
    }}
  ],
  "rationale": "Summary of main improvements (2-3 sentences)",
  "confidence_score": 0.85
}}
Return only JSON, no markdown or additional text."""
    
    def _build_polish_prompt(self, text: str, language: str) -> str:
        """Xây dựng prompt cho việc đánh bóng tóm tắt."""
        if language == "vi":
            return f"""Hãy đánh bóng abstract sau để cải thiện chất lượng học thuật:

{text}

Yêu cầu:
- Giữ nguyên nội dung khoa học và thông tin chính
- Cải thiện tính rõ ràng, mạch lạc
- Nâng cao giọng văn học thuật
- Liệt kê tất cả các thay đổi với giải thích
- Trả về JSON như đã hướng dẫn"""
        else:
            return f"""Please polish the following abstract to improve academic quality:

{text}

Requirements:
- Preserve scientific content and main information
- Improve clarity and coherence
- Elevate academic tone
- List all changes with explanations
- Return JSON as instructed"""
    
    def _parse_polish_response(
        self,
        response: str,
        original_text: str,
        language: str
    ) -> PolishResult:
        """Phân tích phản hồi LLM thành PolishResult."""
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
            
            data = json.loads(json_str)
            
            # Phân tích các thay đổi
            changes = []
            if "changes" in data and isinstance(data["changes"], list):
                for item in data["changes"]:
                    if isinstance(item, dict):
                        changes.append(Change(
                            change_type=item.get("change_type", "unknown"),
                            before=item.get("before", ""),
                            after=item.get("after", ""),
                            position=item.get("position"),
                            explanation=item.get("explanation")
                        ))
            
            return PolishResult(
                original=original_text,
                polished=data.get("polished", original_text),
                changes=changes,
                rationale=data.get("rationale", "Tóm tắt đã được đánh bóng để tăng độ rõ ràng và giọng văn học thuật"),
                confidence_score=data.get("confidence_score", 0.8)
            )
            
        except (json.JSONDecodeError, KeyError, TypeError) as e:
            logger.warning(f"Không thể phân tích phản hồi đánh bóng: {e}")
            logger.debug(f"Phản hồi là: {response[:500]}")
            
            # Dự phòng: trả về văn bản gốc với thay đổi tối thiểu
            return PolishResult(
                original=original_text,
                polished=original_text,
                changes=[],
                rationale="Không thể phân tích phản hồi AI. Văn bản gốc được trả về.",
                confidence_score=0.0
            )


# Global instance
_abstract_polisher: Optional[AbstractPolisher] = None


def get_abstract_polisher() -> AbstractPolisher:
    """Lấy hoặc tạo instance AbstractPolisher toàn cục."""
    global _abstract_polisher
    if _abstract_polisher is None:
        _abstract_polisher = AbstractPolisher()
    return _abstract_polisher


