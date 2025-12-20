"""
Dịch Vụ Tạo Nháp Email
Tạo nháp email cho nhiều nhu cầu giao tiếp hội nghị.
"""
import logging
from typing import Dict, Optional, List
from dataclasses import dataclass
from datetime import datetime
from core.governance.model_manager import get_model_manager
from core.infra.config import get_settings

logger = logging.getLogger(__name__)


@dataclass
class EmailDraft:
    """Biểu diễn một nháp email."""
    subject: str
    body: str
    template_type: str
    personalization: Dict[str, str]
    rationale: str
    requires_review: bool = True


class EmailDraftGenerator:
    """
    Tạo nháp email cho thông báo chấp nhận/từ chối, nhắc nhở và lời mời.
    """
    
    def __init__(self):
        self.model_manager = get_model_manager()
    
    async def draft_decision_email(
        self,
        paper_id: str,
        paper_title: str,
        author_name: str,
        decision: str,  # "accept" hoặc "reject"
        reviews_summary: Optional[str] = None,
        conference_name: str = "",
        camera_ready_deadline: Optional[str] = None,
        language: str = "en"
    ) -> EmailDraft:
        """
        Tạo nháp email thông báo quyết định.
        
        Args:
            paper_id: Mã bài báo
            paper_title: Tiêu đề bài báo
            author_name: Tên tác giả
            decision: Quyết định ("accept" hoặc "reject")
            reviews_summary: Tóm tắt đánh giá tùy chọn
            conference_name: Tên hội nghị
            camera_ready_deadline: Deadline bản camera-ready (cho accept)
            language: Mã ngôn ngữ
            
        Returns:
            Đối tượng EmailDraft
        """
        if decision.lower() == "accept":
            return await self._draft_accept_email(
                paper_id, paper_title, author_name,
                conference_name, camera_ready_deadline, language
            )
        else:
            return await self._draft_reject_email(
                paper_id, paper_title, author_name,
                reviews_summary, conference_name, language
            )
    
    async def _draft_accept_email(
        self,
        paper_id: str,
        paper_title: str,
        author_name: str,
        conference_name: str,
        camera_ready_deadline: Optional[str],
        language: str
    ) -> EmailDraft:
        """Tạo nháp email thông báo chấp nhận."""
        system_instruction = self._get_accept_email_system_prompt(language)
        prompt = self._build_accept_email_prompt(
            paper_title, author_name, conference_name,
            camera_ready_deadline, language
        )
        
        response = await self.model_manager.call_llm(
            prompt=prompt,
            system_instruction=system_instruction,
            model=get_settings().model_name,
            temperature=0.3
        )
        
        return self._parse_email_response(
            response,
            "accept_notification",
            {"author_name": author_name, "paper_title": paper_title},
            language
        )
    
    async def _draft_reject_email(
        self,
        paper_id: str,
        paper_title: str,
        author_name: str,
        reviews_summary: Optional[str],
        conference_name: str,
        language: str
    ) -> EmailDraft:
        """Tạo nháp email thông báo từ chối."""
        system_instruction = self._get_reject_email_system_prompt(language)
        prompt = self._build_reject_email_prompt(
            paper_title, author_name, reviews_summary,
            conference_name, language
        )
        
        response = await self.model_manager.call_llm(
            prompt=prompt,
            system_instruction=system_instruction,
            model=get_settings().model_name,
            temperature=0.3
        )
        
        return self._parse_email_response(
            response,
            "reject_notification",
            {"author_name": author_name, "paper_title": paper_title},
            language
        )
    
    async def draft_reminder_email(
        self,
        reviewer_id: str,
        reviewer_name: str,
        pending_papers: List[Dict],  # [{paper_id, paper_title, deadline}]
        conference_name: str = "",
        language: str = "en"
    ) -> EmailDraft:
        """
        Tạo nháp email nhắc nhở cho phản biện.
        
        Args:
            reviewer_id: Mã phản biện
            reviewer_name: Tên phản biện
            pending_papers: Danh sách bài báo đang chờ
            conference_name: Tên hội nghị
            language: Mã ngôn ngữ
            
        Returns:
            Đối tượng EmailDraft
        """
        system_instruction = self._get_reminder_email_system_prompt(language)
        prompt = self._build_reminder_email_prompt(
            reviewer_name, pending_papers, conference_name, language
        )
        
        response = await self.model_manager.call_llm(
            prompt=prompt,
            system_instruction=system_instruction,
            model=get_settings().model_name,
            temperature=0.3
        )
        
        return self._parse_email_response(
            response,
            "reviewer_reminder",
            {"reviewer_name": reviewer_name},
            language
        )
    
    def _get_accept_email_system_prompt(self, language: str) -> str:
        """Lấy system prompt cho email chấp nhận."""
        if language == "vi":
            return """Bạn là chuyên gia soạn thảo email thông báo chấp nhận bài báo.
Yêu cầu:
- Giọng văn: chuyên nghiệp, khích lệ
- Bao gồm: lời chúc mừng, các bước tiếp theo, deadline camera-ready
- Trả về JSON: {"subject": "...", "body": "..."}
Chỉ trả về JSON, không markdown."""
        else:
            return """You are an expert at drafting paper acceptance notification emails.
Requirements:
- Tone: professional, encouraging
- Include: congratulations, next steps, camera-ready deadline
- Return JSON: {"subject": "...", "body": "..."}
Return only JSON, no markdown."""
    
    def _build_accept_email_prompt(
        self,
        paper_title: str,
        author_name: str,
        conference_name: str,
        deadline: Optional[str],
        language: str
    ) -> str:
        """Xây dựng prompt cho email chấp nhận."""
        if language == "vi":
            return f"""Soạn email thông báo chấp nhận bài báo:

Tiêu đề bài báo: {paper_title}
Tác giả: {author_name}
Hội nghị: {conference_name}
Deadline camera-ready: {deadline or "Chưa xác định"}

Yêu cầu: Email chuyên nghiệp, khích lệ, bao gồm các bước tiếp theo."""
        else:
            return f"""Draft acceptance notification email:

Paper Title: {paper_title}
Author: {author_name}
Conference: {conference_name}
Camera-ready Deadline: {deadline or "TBD"}

Requirements: Professional, encouraging email with next steps."""
    
    def _get_reject_email_system_prompt(self, language: str) -> str:
        """Lấy system prompt cho email từ chối."""
        if language == "vi":
            return """Bạn là chuyên gia soạn thảo email thông báo từ chối bài báo.
Yêu cầu:
- Giọng văn: tôn trọng, hỗ trợ
- Bao gồm: tóm tắt phản biện xây dựng, khuyến khích nộp lại
- Trả về JSON: {"subject": "...", "body": "..."}
Chỉ trả về JSON, không markdown."""
        else:
            return """You are an expert at drafting paper rejection notification emails.
Requirements:
- Tone: respectful, supportive
- Include: constructive review summary, encouragement for future submissions
- Return JSON: {"subject": "...", "body": "..."}
Return only JSON, no markdown."""
    
    def _build_reject_email_prompt(
        self,
        paper_title: str,
        author_name: str,
        reviews_summary: Optional[str],
        conference_name: str,
        language: str
    ) -> str:
        """Xây dựng prompt cho email từ chối."""
        if language == "vi":
            return f"""Soạn email thông báo từ chối bài báo:

Tiêu đề bài báo: {paper_title}
Tác giả: {author_name}
Hội nghị: {conference_name}
Tóm tắt phản biện: {reviews_summary or "Không có"}

Yêu cầu: Email tôn trọng, hỗ trợ, bao gồm phản hồi xây dựng."""
        else:
            return f"""Draft rejection notification email:

Paper Title: {paper_title}
Author: {author_name}
Conference: {conference_name}
Review Summary: {reviews_summary or "Not provided"}

Requirements: Respectful, supportive email with constructive feedback."""
    
    def _get_reminder_email_system_prompt(self, language: str) -> str:
        """Lấy system prompt cho email nhắc nhở."""
        if language == "vi":
            return """Bạn là chuyên gia soạn thảo email nhắc nhở reviewer.
Yêu cầu:
- Giọng văn: lịch sự, khẩn trương nếu cần
- Bao gồm: số bài đang chờ, deadline, link dashboard
- Trả về JSON: {"subject": "...", "body": "..."}
Chỉ trả về JSON, không markdown."""
        else:
            return """You are an expert at drafting reviewer reminder emails.
Requirements:
- Tone: polite, urgent if needed
- Include: pending paper count, deadline, dashboard link
- Return JSON: {"subject": "...", "body": "..."}
Return only JSON, no markdown."""
    
    def _build_reminder_email_prompt(
        self,
        reviewer_name: str,
        pending_papers: List[Dict],
        conference_name: str,
        language: str
    ) -> str:
        """Xây dựng prompt cho email nhắc nhở."""
        papers_list = "\n".join([
            f"- {p.get('paper_title', 'Unknown')} (Deadline: {p.get('deadline', 'TBD')})"
            for p in pending_papers
        ])
        
        if language == "vi":
            return f"""Soạn email nhắc nhở reviewer:

Tên reviewer: {reviewer_name}
Hội nghị: {conference_name}
Số bài đang chờ: {len(pending_papers)}
Danh sách bài:
{papers_list}

Yêu cầu: Email lịch sự, nhắc nhở deadline."""
        else:
            return f"""Draft reviewer reminder email:

Reviewer Name: {reviewer_name}
Conference: {conference_name}
Pending Papers: {len(pending_papers)}
Papers:
{papers_list}

Requirements: Polite email reminding about deadlines."""
    
    def _parse_email_response(
        self,
        response: str,
        template_type: str,
        personalization: Dict[str, str],
        language: str
    ) -> EmailDraft:
        """Phân tích phản hồi LLM thành EmailDraft."""
        import json
        
        try:
            json_str = response.strip()
            if json_str.startswith("```json"):
                json_str = json_str[7:]
            if json_str.startswith("```"):
                json_str = json_str[3:]
            if json_str.endswith("```"):
                json_str = json_str[:-3]
            json_str = json_str.strip()
            
            data = json.loads(json_str)
            
            return EmailDraft(
                subject=data.get("subject", ""),
                body=data.get("body", ""),
                template_type=template_type,
                personalization=personalization,
                rationale=f"Generated {template_type} email draft",
                requires_review=True
            )
            
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Không thể phân tích phản hồi email: {e}")
            raise ValueError(f"Không thể phân tích nháp email: {e}")


# Global instance
_email_generator: Optional[EmailDraftGenerator] = None


def get_email_generator() -> EmailDraftGenerator:
    """Lấy hoặc tạo instance toàn cục của EmailDraftGenerator."""
    global _email_generator
    if _email_generator is None:
        _email_generator = EmailDraftGenerator()
    return _email_generator



