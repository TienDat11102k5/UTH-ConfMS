"""
Dịch vụ Bảo mật Dữ liệu cho Đánh giá Mù Đôi
Đảm bảo loại bỏ PII và ẩn danh hóa trước khi xử lý AI.
"""
import re
import logging
from typing import Optional, Dict, List, Tuple
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class RedactionResult:
    """Kết quả của thao tác biên tập."""
    redacted_text: str
    redacted_items: List[Dict[str, str]]  # List of {type, original, replacement}
    has_pii: bool


class RedactionService:
    """
    Dịch vụ biên tập PII và thông tin tác giả trong giai đoạn đánh giá mù đôi.
    """
    
    # Common patterns for PII detection
    EMAIL_PATTERN = re.compile(
        r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    )
    PHONE_PATTERN = re.compile(
        r'(\+?\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}'
    )
    URL_PATTERN = re.compile(
        r'https?://[^\s<>"{}|\\^`\[\]]+'
    )
    
    # Author name patterns (common in academic papers)
    AUTHOR_PATTERN = re.compile(
        r'\b(?:Author|Authors?|Corresponding\s+Author|First\s+Author|Senior\s+Author)\s*[:\-]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
        re.IGNORECASE
    )
    
    # Affiliation patterns
    AFFILIATION_PATTERN = re.compile(
        r'\b(?:Affiliation|Institution|University|Department|School|College)\s*[:\-]?\s*([A-Z][^\.]+)',
        re.IGNORECASE
    )
    
    # ORCID pattern
    ORCID_PATTERN = re.compile(
        r'\b(?:ORCID|orcid\.org)[:\s]?([0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{3}[0-9X])',
        re.IGNORECASE
    )
    
    def __init__(self):
        self.redaction_counter = 0
    
    def _generate_placeholder(self, item_type: str) -> str:
        """Tạo placeholder cho nội dung đã biên tập."""
        self.redaction_counter += 1
        return f"[{item_type.upper()}_{self.redaction_counter}]"
    
    def redact_author_info(self, text: str, author_names: Optional[List[str]] = None) -> RedactionResult:
        """
        Biên tập thông tin tác giả từ văn bản.
        
        Args:
            text: Văn bản đầu vào có thể chứa thông tin tác giả
            author_names: Danh sách tùy chọn tên tác giả đã biết để biên tập
            
        Returns:
            RedactionResult với văn bản đã biên tập và metadata
        """
        redacted_text = text
        redacted_items = []
        has_pii = False
        
        # Biên tập tên tác giả đã biết
        if author_names:
            for name in author_names:
                # Tạo mẫu cho tên (không phân biệt hoa thường)
                pattern = re.compile(re.escape(name), re.IGNORECASE)
                matches = pattern.findall(redacted_text)
                if matches:
                    has_pii = True
                    placeholder = self._generate_placeholder("AUTHOR")
                    redacted_text = pattern.sub(placeholder, redacted_text)
                    redacted_items.append({
                        "type": "author_name",
                        "original": name,
                        "replacement": placeholder
                    })
        
        # Biên tập các mẫu tác giả
        author_matches = self.AUTHOR_PATTERN.finditer(redacted_text)
        for match in author_matches:
            has_pii = True
            author_name = match.group(1)
            placeholder = self._generate_placeholder("AUTHOR")
            redacted_text = redacted_text.replace(match.group(0), f"Tác giả: {placeholder}")
            redacted_items.append({
                "type": "author_pattern",
                "original": author_name,
                "replacement": placeholder
            })
        
        # Biên tập đơn vị
        affiliation_matches = self.AFFILIATION_PATTERN.finditer(redacted_text)
        for match in affiliation_matches:
            has_pii = True
            affiliation = match.group(1)
            placeholder = self._generate_placeholder("AFFILIATION")
            redacted_text = redacted_text.replace(match.group(0), f"Đơn vị: {placeholder}")
            redacted_items.append({
                "type": "affiliation",
                "original": affiliation,
                "replacement": placeholder
            })
        
        # Biên tập ORCID
        orcid_matches = self.ORCID_PATTERN.finditer(redacted_text)
        for match in orcid_matches:
            has_pii = True
            orcid = match.group(1)
            placeholder = self._generate_placeholder("ORCID")
            redacted_text = redacted_text.replace(match.group(0), f"ORCID: {placeholder}")
            redacted_items.append({
                "type": "orcid",
                "original": orcid,
                "replacement": placeholder
            })
        
        return RedactionResult(
            redacted_text=redacted_text,
            redacted_items=redacted_items,
            has_pii=has_pii
        )
    
    def anonymize_paper_content(
        self,
        text: str,
        author_names: Optional[List[str]] = None,
        redact_emails: bool = True,
        redact_urls: bool = True,
        redact_phones: bool = True
    ) -> RedactionResult:
        """
        Ẩn danh hóa nội dung bài báo bằng cách loại bỏ tất cả PII.
        
        Args:
            text: Văn bản nội dung bài báo
            author_names: Danh sách tùy chọn tên tác giả để biên tập
            redact_emails: Có biên tập địa chỉ email hay không
            redact_urls: Có biên tập URLs hay không
            redact_phones: Có biên tập số điện thoại hay không
            
        Returns:
            RedactionResult với văn bản đã ẩn danh hóa
        """
        # Bắt đầu với biên tập thông tin tác giả
        result = self.redact_author_info(text, author_names)
        redacted_text = result.redacted_text
        redacted_items = result.redacted_items.copy()
        has_pii = result.has_pii
        
        # Biên tập địa chỉ email
        if redact_emails:
            email_matches = self.EMAIL_PATTERN.finditer(redacted_text)
            for match in email_matches:
                has_pii = True
                email = match.group(0)
                placeholder = self._generate_placeholder("EMAIL")
                redacted_text = redacted_text.replace(email, placeholder)
                redacted_items.append({
                    "type": "email",
                    "original": email,
                    "replacement": placeholder
                })
        
        # Biên tập URLs
        if redact_urls:
            url_matches = self.URL_PATTERN.finditer(redacted_text)
            for match in url_matches:
                has_pii = True
                url = match.group(0)
                placeholder = self._generate_placeholder("URL")
                redacted_text = redacted_text.replace(url, placeholder)
                redacted_items.append({
                    "type": "url",
                    "original": url,
                    "replacement": placeholder
                })
        
        # Biên tập số điện thoại
        if redact_phones:
            phone_matches = self.PHONE_PATTERN.finditer(redacted_text)
            for match in phone_matches:
                has_pii = True
                phone = match.group(0)
                placeholder = self._generate_placeholder("PHONE")
                redacted_text = redacted_text.replace(phone, placeholder)
                redacted_items.append({
                    "type": "phone",
                    "original": phone,
                    "replacement": placeholder
                })
        
        return RedactionResult(
            redacted_text=redacted_text,
            redacted_items=redacted_items,
            has_pii=has_pii
        )
    
    def check_pii_presence(self, text: str) -> Dict[str, bool]:
        """
        Kiểm tra xem văn bản có chứa PII mà không biên tập.
        
        Args:
            text: Văn bản cần kiểm tra
            
        Returns:
            Dictionary chỉ ra sự hiện diện của các loại PII khác nhau
        """
        return {
            "has_email": bool(self.EMAIL_PATTERN.search(text)),
            "has_phone": bool(self.PHONE_PATTERN.search(text)),
            "has_url": bool(self.URL_PATTERN.search(text)),
            "has_author_info": bool(self.AUTHOR_PATTERN.search(text)),
            "has_affiliation": bool(self.AFFILIATION_PATTERN.search(text)),
            "has_orcid": bool(self.ORCID_PATTERN.search(text))
        }


# Global singleton instance
_redaction_service: Optional[RedactionService] = None


def get_redaction_service() -> RedactionService:
    """Lấy hoặc tạo instance global RedactionService."""
    global _redaction_service
    if _redaction_service is None:
        _redaction_service = RedactionService()
    return _redaction_service


