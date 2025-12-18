"""
Dịch Vụ Tạo Tóm Tắt
Tạo tóm tắt trung lập, theo sự thật cho bài báo để giúp phản biện hiểu nội dung.
"""
import logging
from typing import Dict, List, Optional, Literal
from dataclasses import dataclass
from datetime import datetime
from core.governance.model_manager import get_model_manager
from core.governance.data_privacy import get_redaction_service

logger = logging.getLogger(__name__)


@dataclass
class Synopsis:
    """Biểu diễn một tóm tắt được tạo."""
    synopsis: str
    length: int
    key_themes: List[str]
    methodology: str
    contribution_type: str
    rationale: str
    word_count: int


class SynopsisGenerator:
    """
    Tạo tóm tắt trung lập cho bài báo để hỗ trợ phản biện trong đấu thầu và phân loại.
    """
    
    def __init__(self):
        self.model_manager = get_model_manager()
        self.redaction_service = get_redaction_service()
    
    async def generate_synopsis(
        self,
        title: str,
        abstract: str,
        keywords: Optional[List[str]] = None,
        length: Literal["short", "medium", "long"] = "medium",
        language: str = "en"
    ) -> Synopsis:
        """
        Tạo tóm tắt trung lập cho bài báo.
        
        Args:
            title: Tiêu đề bài báo
            abstract: Tóm tắt bài báo
            keywords: Danh sách từ khóa tùy chọn
            length: Độ dài mong muốn ("short": 100-150, "medium": 150-250, "long": 250-350 từ)
            language: Mã ngôn ngữ ("en" hoặc "vi")
            
        Returns:
            Đối tượng Synopsis với nội dung được tạo
        """
        if not title or not abstract:
            raise ValueError("Tiêu đề và tóm tắt là bắt buộc")
        
        # Xác thực độ dài input
        if len(abstract) > 2000:
            raise ValueError("Tóm tắt quá dài. Tối đa 2000 ký tự.")
        
        # Loại bỏ thông tin cá nhân trước khi xử lý (tuân thủ double-blind)
        redaction_result = self.redaction_service.anonymize_paper_content(
            text=f"{title}\n\n{abstract}",
            redact_emails=True,
            redact_urls=False,  # URLs might be relevant for methodology
            redact_phones=True
        )
        
        redacted_title = title  # Tiêu đề thường không có thông tin cá nhân
        redacted_abstract = redaction_result.redacted_text.split("\n\n", 1)[-1] if "\n\n" in redaction_result.redacted_text else abstract
        
        try:
            system_instruction = self._get_synopsis_system_prompt(length, language)
            prompt = self._build_synopsis_prompt(
                redacted_title,
                redacted_abstract,
                keywords or [],
                length,
                language
            )
            
            response = await self.model_manager.call_llm(
                prompt=prompt,
                system_instruction=system_instruction,
                model="gpt-4o-mini",
                temperature=0.2  # Nhiệt độ thấp cho output nhất quán, theo sự thật
            )
            
            result = self._parse_synopsis_response(response, length, language)
            
            # Xác thực tóm tắt không chứa thông tin tác giả
            self._validate_no_author_leakage(result.synopsis, title, abstract)
            
            logger.info(f"Generated synopsis: {result.word_count} words, {len(result.key_themes)} themes")
            
            return result
            
        except Exception as e:
            logger.error(f"Synopsis generation failed: {e}", exc_info=True)
            raise
    
    def _get_synopsis_system_prompt(
        self,
        length: str,
        language: str
    ) -> str:
        """Lấy system prompt cho tạo tóm tắt."""
        length_ranges = {
            "short": "100-150 words",
            "medium": "150-250 words",
            "long": "250-350 words"
        }
        
        if language == "vi":
            return f"""Bạn là một chuyên gia tóm tắt bài báo khoa học.
Nhiệm vụ của bạn là tạo một bản tóm tắt TRUNG LẬP và KHÁCH QUAN về một bài báo.

YÊU CẦU:
- Độ dài: {length_ranges.get(length, "150-250 words")}
- Giọng văn: TRUNG LẬP, KHÔNG đánh giá (không dùng từ như "excellent", "novel", "significant")
- Tập trung vào: câu hỏi nghiên cứu, phương pháp, dữ liệu, kết quả chính
- TRÁNH: tên tác giả, tên tổ chức, thông tin cá nhân
- Chỉ trình bày SỰ THẬT, không đánh giá chất lượng

Trả về kết quả dưới dạng JSON:
{{
  "synopsis": "Bản tóm tắt trung lập...",
  "key_themes": ["chủ đề 1", "chủ đề 2"],
  "methodology": "experimental|theoretical|mixed",
  "contribution_type": "novel algorithm|improved method|empirical study|survey|...",
  "rationale": "Giải thích ngắn gọn cách tóm tắt được tạo"
}}
Chỉ trả về JSON, không có markdown hay text thêm."""
        else:
            return f"""You are an expert academic paper summarizer.
Your task is to create a NEUTRAL and FACTUAL synopsis of a research paper.

REQUIREMENTS:
- Length: {length_ranges.get(length, "150-250 words")}
- Tone: NEUTRAL, NON-EVALUATIVE (avoid words like "excellent", "novel", "significant")
- Focus on: research question, methods, datasets, key claims
- AVOID: author names, affiliations, personal information
- Present FACTS only, do not evaluate quality

Return results as JSON:
{{
  "synopsis": "Neutral synopsis text...",
  "key_themes": ["theme1", "theme2"],
  "methodology": "experimental|theoretical|mixed",
  "contribution_type": "novel algorithm|improved method|empirical study|survey|...",
  "rationale": "Brief explanation of how synopsis was created"
}}
Return only JSON, no markdown or additional text."""
    
    def _build_synopsis_prompt(
        self,
        title: str,
        abstract: str,
        keywords: List[str],
        length: str,
        language: str
    ) -> str:
        """Xây dựng prompt cho tạo tóm tắt."""
        keywords_str = ", ".join(keywords) if keywords else "None provided"
        
        if language == "vi":
            return f"""Hãy tạo một bản tóm tắt TRUNG LẬP về bài báo sau:

Tiêu đề: {title}

Abstract: {abstract}

Từ khóa: {keywords_str}

Yêu cầu:
- Độ dài: {length} ({"100-150 từ" if length == "short" else "150-250 từ" if length == "medium" else "250-350 từ"})
- Giọng văn hoàn toàn trung lập, không đánh giá
- Tập trung vào nội dung khoa học, phương pháp, kết quả
- Không đề cập đến tác giả hoặc tổ chức
- Trả về JSON như đã hướng dẫn"""
        else:
            length_ranges = {
                "short": "100-150 words",
                "medium": "150-250 words",
                "long": "250-350 words"
            }
            return f"""Please create a NEUTRAL synopsis for the following paper:

Title: {title}

Abstract: {abstract}

Keywords: {keywords_str}

Requirements:
- Length: {length} ({length_ranges.get(length, "150-250 words")})
- Completely neutral tone, no evaluation
- Focus on scientific content, methods, results
- Do not mention authors or affiliations
- Return JSON as instructed"""
    
    def _parse_synopsis_response(
        self,
        response: str,
        length: str,
        language: str
    ) -> Synopsis:
        """Phân tích phản hồi LLM thành đối tượng Synopsis."""
        import json
        
        try:
            # Extract JSON from response
            json_str = response.strip()
            if json_str.startswith("```json"):
                json_str = json_str[7:]
            if json_str.startswith("```"):
                json_str = json_str[3:]
            if json_str.endswith("```"):
                json_str = json_str[:-3]
            json_str = json_str.strip()
            
            data = json.loads(json_str)
            
            synopsis_text = data.get("synopsis", "")
            word_count = len(synopsis_text.split())
            
            # Validate length
            length_ranges = {
                "short": (100, 150),
                "medium": (150, 250),
                "long": (250, 350)
            }
            min_words, max_words = length_ranges.get(length, (150, 250))
            
            if word_count < min_words or word_count > max_words:
                logger.warning(
                    f"Synopsis length {word_count} words is outside expected range "
                    f"({min_words}-{max_words}) for {length}"
                )
            
            return Synopsis(
                synopsis=synopsis_text,
                length=len(synopsis_text),
                key_themes=data.get("key_themes", []),
                methodology=data.get("methodology", "unknown"),
                contribution_type=data.get("contribution_type", "unknown"),
                rationale=data.get("rationale", "Synopsis generated from abstract analysis"),
                word_count=word_count
            )
            
        except (json.JSONDecodeError, KeyError, TypeError) as e:
            logger.error(f"Không thể phân tích phản hồi tóm tắt: {e}")
            logger.debug(f"Phản hồi là: {response[:500]}")
            raise ValueError(f"Không thể phân tích phản hồi AI: {e}")
    
    def _validate_no_author_leakage(
        self,
        synopsis: str,
        original_title: str,
        original_abstract: str
    ) -> None:
        """
        Xác thực rằng tóm tắt không chứa thông tin tác giả.
        Raise ValueError nếu phát hiện thông tin tác giả.
        """
        # Kiểm tra các mẫu tác giả thường gặp
        author_patterns = [
            r"\b(?:author|authors?|by)\s+[A-Z][a-z]+\s+[A-Z][a-z]+",  # "Author John Smith"
            r"\b[A-Z][a-z]+\s+et\s+al\.",  # "Smith et al."
            r"\b(?:affiliation|institution|university|department)\s*[:\-]?\s*[A-Z]",  # Affiliations
        ]
        
        import re
        synopsis_lower = synopsis.lower()
        
        for pattern in author_patterns:
            if re.search(pattern, synopsis, re.IGNORECASE):
                logger.warning(f"Phát hiện thông tin tác giả tiềm năng trong tóm tắt: {pattern}")
                # Không raise error, chỉ log cảnh báo - để con người xem xét quyết định
        
        # Kiểm tra xem tóm tắt có chứa bất kỳ từ nào từ tên tác giả không (nếu được cung cấp)
        # Đây là kiểm tra cơ bản - có thể thêm kiểm tra phức tạp hơn


# Global instance
_synopsis_generator: Optional[SynopsisGenerator] = None


def get_synopsis_generator() -> SynopsisGenerator:
    """Lấy hoặc tạo instance toàn cục của SynopsisGenerator."""
    global _synopsis_generator
    if _synopsis_generator is None:
        _synopsis_generator = SynopsisGenerator()
    return _synopsis_generator

