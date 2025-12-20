"""
Dịch vụ Xác thực Đánh giá Mù Đôi
Đảm bảo tóm tắt và tóm lược không rò rỉ thông tin định danh tác giả.
"""
import re
import logging
from typing import Dict, List, Optional
from core.governance.data_privacy import get_redaction_service

logger = logging.getLogger(__name__)


class DoubleBlindValidator:
    """
    Xác thực rằng nội dung được tạo không rò rỉ thông tin định danh tác giả.
    """
    
    def __init__(self):
        self.redaction_service = get_redaction_service()
    
    def validate_synopsis(
        self,
        synopsis: str,
        paper_metadata: Dict,
        author_names: Optional[List[str]] = None
    ) -> Dict[str, any]:
        """
        Xác thực tóm tắt tuân thủ đánh giá mù đôi.
        
        Args:
            synopsis: Văn bản tóm tắt được tạo
            paper_metadata: Metadata bài báo (tiêu đề, tóm tắt, v.v.)
            author_names: Danh sách tùy chọn tên tác giả để kiểm tra
            
        Returns:
            Dictionary với kết quả xác thực:
            {
                "is_valid": bool,
                "issues": List[str],
                "redacted_synopsis": str
            }
        """
        issues = []
        redacted_synopsis = synopsis
        
        # Kiểm tra các mẫu tên tác giả
        author_patterns = [
            r"\b(?:author|authors?|by)\s+[A-Z][a-z]+\s+[A-Z][a-z]+",
            r"\b[A-Z][a-z]+\s+et\s+al\.",
            r"\b(?:professor|prof\.|dr\.|doctor)\s+[A-Z][a-z]+",
        ]
        
        for pattern in author_patterns:
            matches = re.findall(pattern, synopsis, re.IGNORECASE)
            if matches:
                issues.append(f"Phát hiện mẫu tên tác giả tiềm năng: {matches[0]}")
        
        # Kiểm tra với tên tác giả đã biết
        if author_names:
            synopsis_lower = synopsis.lower()
            for name in author_names:
                name_parts = name.lower().split()
                # Kiểm tra nếu bất kỳ phần nào của tên xuất hiện trong tóm tắt
                for part in name_parts:
                    if len(part) > 3 and part in synopsis_lower:
                        # Kiểm tra nếu không phải từ thông dụng
                        if part not in ["the", "and", "for", "with", "from", "this", "that"]:
                            issues.append(f"Phát hiện tên tác giả tiềm năng: {part}")
        
        # Kiểm tra các mẫu đơn vị
        affiliation_keywords = [
            "university", "institution", "department", "laboratory", "lab",
            "affiliation", "organization", "company", "corporation"
        ]
        
        for keyword in affiliation_keywords:
            pattern = rf"\b{keyword}\s+of\s+[A-Z][a-z]+"
            if re.search(pattern, synopsis, re.IGNORECASE):
                issues.append(f"Phát hiện thông tin đơn vị tiềm năng: {keyword}")
        
        # Biên tập nếu phát hiện vấn đề
        if issues:
            redaction_result = self.redaction_service.anonymize_paper_content(
                text=synopsis,
                author_names=author_names,
                redact_emails=True,
                redact_urls=False,
                redact_phones=True
            )
            redacted_synopsis = redaction_result.redacted_text
        
        return {
            "is_valid": len(issues) == 0,
            "issues": issues,
            "redacted_synopsis": redacted_synopsis
        }
    
    def redact_if_needed(
        self,
        content: str,
        author_names: Optional[List[str]] = None
    ) -> str:
        """
        Biên tập nội dung nếu chứa thông tin tác giả.
        
        Args:
            content: Nội dung cần kiểm tra và biên tập
            author_names: Danh sách tùy chọn tên tác giả
            
        Returns:
            Nội dung đã biên tập
        """
        validation = self.validate_synopsis(content, {}, author_names)
        return validation["redacted_synopsis"]


# Global instance
_double_blind_validator: Optional[DoubleBlindValidator] = None


def get_double_blind_validator() -> DoubleBlindValidator:
    """Lấy hoặc tạo instance global DoubleBlindValidator."""
    global _double_blind_validator
    if _double_blind_validator is None:
        _double_blind_validator = DoubleBlindValidator()
    return _double_blind_validator




