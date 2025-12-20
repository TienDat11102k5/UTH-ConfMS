"""
Dịch Vụ Kiểm Tra Ngôn Ngữ
Cung cấp kiểm tra chính tả và ngữ pháp cho tiếng Anh và tiếng Việt.
"""
import re
import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from core.governance.model_manager import get_model_manager
from core.governance.data_privacy import get_redaction_service
from core.infra.config import get_settings

logger = logging.getLogger(__name__)


@dataclass
class SpellingError:
    """Biểu diễn một lỗi chính tả."""
    word: str
    position: int
    suggestions: List[str]
    context: Optional[str] = None


@dataclass
class GrammarError:
    """Biểu diễn một lỗi ngữ pháp."""
    error_type: str
    position: int
    original: str
    suggestion: str
    explanation: Optional[str] = None
    context: Optional[str] = None


class SpellChecker:
    """
    Trình kiểm tra chính tả sử dụng LLM cho tiếng Anh và tiếng Việt.
    """
    
    def __init__(self):
        self.model_manager = get_model_manager()
    
    async def check_spelling(
        self, 
        text: str, 
        language: str = "en"
    ) -> List[SpellingError]:
        """
        Kiểm tra lỗi chính tả trong văn bản.
        
        Args:
            text: Văn bản cần kiểm tra
            language: Mã ngôn ngữ ("en" hoặc "vi")
            
        Returns:
            Danh sách các đối tượng SpellingError
        """
        if not text or len(text.strip()) == 0:
            return []
        
        # Validate input length
        if len(text) > 10000:
            raise ValueError("Text too long. Maximum 10000 characters allowed.")
        
        try:
            system_instruction = self._get_spell_check_system_prompt(language)
            prompt = self._build_spell_check_prompt(text, language)
            
            response = await self.model_manager.call_llm(
                prompt=prompt,
                system_instruction=system_instruction,
                model=get_settings().model_name,
                temperature=0.1  # Nhiệt độ thấp cho kết quả nhất quán
            )
            
            errors = self._parse_spell_check_response(response, text)
            logger.info(f"Found {len(errors)} spelling errors in {language} text")
            
            return errors
            
        except Exception as e:
            logger.error(f"Spell check failed: {e}", exc_info=True)
            raise
    
    def _get_spell_check_system_prompt(self, language: str) -> str:
        """Lấy system prompt cho kiểm tra chính tả."""
        if language == "vi":
            return """Bạn là một chuyên gia kiểm tra chính tả tiếng Việt. 
Nhiệm vụ của bạn là tìm và liệt kê tất cả các lỗi chính tả trong văn bản.
Trả về kết quả dưới dạng JSON array với format:
[
  {
    "word": "từ_sai",
    "position": 45,
    "suggestions": ["từ_đúng1", "từ_đúng2"],
    "context": "câu chứa từ sai"
  }
]
Chỉ trả về JSON, không có markdown hay text thêm."""
        else:
            return """You are an expert English spell checker.
Your task is to find and list all spelling errors in the text.
Return results as a JSON array with format:
[
  {
    "word": "misspelled_word",
    "position": 45,
    "suggestions": ["correct_word1", "correct_word2"],
    "context": "sentence containing the error"
  }
]
Return only JSON, no markdown or additional text."""
    
    def _build_spell_check_prompt(self, text: str, language: str) -> str:
        """Xây dựng prompt cho kiểm tra chính tả."""
        if language == "vi":
            return f"""Hãy kiểm tra chính tả trong văn bản sau và trả về danh sách các lỗi chính tả:

{text}

Lưu ý:
- Tìm tất cả các từ viết sai chính tả
- Đưa ra các gợi ý sửa chửa
- Ghi rõ vị trí (số ký tự từ đầu văn bản)
- Trả về JSON array như đã hướng dẫn"""
        else:
            return f"""Please check spelling in the following text and return a list of spelling errors:

{text}

Note:
- Find all misspelled words
- Provide correction suggestions
- Specify position (character offset from start)
- Return JSON array as instructed"""
    
    def _parse_spell_check_response(
        self, 
        response: str, 
        original_text: str
    ) -> List[SpellingError]:
        """Phân tích phản hồi LLM thành các đối tượng SpellingError."""
        import json
        
        try:
            # Try to extract JSON from response
            json_str = response.strip()
            if json_str.startswith("```json"):
                json_str = json_str[7:]
            if json_str.startswith("```"):
                json_str = json_str[3:]
            if json_str.endswith("```"):
                json_str = json_str[:-3]
            json_str = json_str.strip()
            
            errors_data = json.loads(json_str)
            
            errors = []
            for item in errors_data:
                if isinstance(item, dict) and "word" in item:
                    errors.append(SpellingError(
                        word=item.get("word", ""),
                        position=item.get("position", 0),
                        suggestions=item.get("suggestions", []),
                        context=item.get("context")
                    ))
            
            return errors
            
        except (json.JSONDecodeError, KeyError, TypeError) as e:
            logger.warning(f"Failed to parse spell check response: {e}")
            logger.debug(f"Response was: {response[:500]}")
            return []


class GrammarChecker:
    """
    Trình kiểm tra ngữ pháp sử dụng LLM cho tiếng Anh và tiếng Việt.
    """
    
    def __init__(self):
        self.model_manager = get_model_manager()
    
    async def check_grammar(
        self, 
        text: str, 
        language: str = "en"
    ) -> List[GrammarError]:
        """
        Kiểm tra lỗi ngữ pháp trong văn bản.
        
        Args:
            text: Văn bản cần kiểm tra
            language: Mã ngôn ngữ ("en" hoặc "vi")
            
        Returns:
            Danh sách các đối tượng GrammarError
        """
        if not text or len(text.strip()) == 0:
            return []
        
        # Validate input length
        if len(text) > 10000:
            raise ValueError("Text too long. Maximum 10000 characters allowed.")
        
        try:
            system_instruction = self._get_grammar_check_system_prompt(language)
            prompt = self._build_grammar_check_prompt(text, language)
            
            response = await self.model_manager.call_llm(
                prompt=prompt,
                system_instruction=system_instruction,
                model=get_settings().model_name,
                temperature=0.1
            )
            
            errors = self._parse_grammar_check_response(response, text)
            logger.info(f"Found {len(errors)} grammar errors in {language} text")
            
            return errors
            
        except Exception as e:
            logger.error(f"Grammar check failed: {e}", exc_info=True)
            raise
    
    def _get_grammar_check_system_prompt(self, language: str) -> str:
        """Lấy system prompt cho kiểm tra ngữ pháp."""
        if language == "vi":
            return """Bạn là một chuyên gia kiểm tra ngữ pháp tiếng Việt.
Nhiệm vụ của bạn là tìm và liệt kê tất cả các lỗi ngữ pháp trong văn bản.
Trả về kết quả dưới dạng JSON array với format:
[
  {
    "error_type": "loại_lỗi",
    "position": 120,
    "original": "cụm_từ_sai",
    "suggestion": "cụm_từ_đúng",
    "explanation": "giải thích lỗi",
    "context": "câu chứa lỗi"
  }
]
Chỉ trả về JSON, không có markdown hay text thêm."""
        else:
            return """You are an expert English grammar checker.
Your task is to find and list all grammar errors in the text.
Return results as a JSON array with format:
[
  {
    "error_type": "error_type_name",
    "position": 120,
    "original": "incorrect_phrase",
    "suggestion": "correct_phrase",
    "explanation": "explanation of the error",
    "context": "sentence containing the error"
  }
]
Return only JSON, no markdown or additional text."""
    
    def _build_grammar_check_prompt(self, text: str, language: str) -> str:
        """Xây dựng prompt cho kiểm tra ngữ pháp."""
        if language == "vi":
            return f"""Hãy kiểm tra ngữ pháp trong văn bản sau và trả về danh sách các lỗi ngữ pháp:

{text}

Lưu ý:
- Tìm tất cả các lỗi ngữ pháp (hòa hợp chủ-vị, thì, cấu trúc câu, v.v.)
- Đưa ra gợi ý sửa chữa
- Ghi rõ vị trí và giải thích lỗi
- Trả về JSON array như đã hướng dẫn"""
        else:
            return f"""Please check grammar in the following text and return a list of grammar errors:

{text}

Note:
- Find all grammar errors (subject-verb agreement, tense, sentence structure, etc.)
- Provide correction suggestions
- Specify position and explain the error
- Return JSON array as instructed"""
    
    def _parse_grammar_check_response(
        self, 
        response: str, 
        original_text: str
    ) -> List[GrammarError]:
        """Phân tích phản hồi LLM thành các đối tượng GrammarError."""
        import json
        
        try:
            # Try to extract JSON from response
            json_str = response.strip()
            if json_str.startswith("```json"):
                json_str = json_str[7:]
            if json_str.startswith("```"):
                json_str = json_str[3:]
            if json_str.endswith("```"):
                json_str = json_str[:-3]
            json_str = json_str.strip()
            
            errors_data = json.loads(json_str)
            
            errors = []
            for item in errors_data:
                if isinstance(item, dict) and "error_type" in item:
                    errors.append(GrammarError(
                        error_type=item.get("error_type", "unknown"),
                        position=item.get("position", 0),
                        original=item.get("original", ""),
                        suggestion=item.get("suggestion", ""),
                        explanation=item.get("explanation"),
                        context=item.get("context")
                    ))
            
            return errors
            
        except (json.JSONDecodeError, KeyError, TypeError) as e:
            logger.warning(f"Không thể phân tích phản hồi kiểm tra ngữ pháp: {e}")
            logger.debug(f"Phản hồi là: {response[:500]}")
            return []


# Global instances
_spell_checker: Optional[SpellChecker] = None
_grammar_checker: Optional[GrammarChecker] = None


def get_spell_checker() -> SpellChecker:
    """Lấy hoặc tạo instance toàn cục của SpellChecker."""
    global _spell_checker
    if _spell_checker is None:
        _spell_checker = SpellChecker()
    return _spell_checker


def get_grammar_checker() -> GrammarChecker:
    """Lấy hoặc tạo instance toàn cục của GrammarChecker."""
    global _grammar_checker
    if _grammar_checker is None:
        _grammar_checker = GrammarChecker()
    return _grammar_checker



