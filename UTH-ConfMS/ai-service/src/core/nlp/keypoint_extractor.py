"""
Dịch Vụ Trích Xuất Điểm Chính
Trích xuất các điểm chính (tuyên bố, phương pháp, dataset, điểm mới, hạn chế) từ bài báo.
"""
import logging
from typing import List, Dict, Optional
from dataclasses import dataclass
from core.governance.model_manager import get_model_manager
from core.governance.data_privacy import get_redaction_service

logger = logging.getLogger(__name__)


@dataclass
class Claim:
    """Biểu diễn một tuyên bố chính từ bài báo."""
    text: str
    confidence: float  # 0.0-1.0


@dataclass
class Method:
    """Biểu diễn một phương pháp được sử dụng trong bài báo."""
    name: str
    details: str


@dataclass
class Dataset:
    """Biểu diễn một dataset được sử dụng trong bài báo."""
    name: str
    usage: str  # "training", "evaluation", "both", etc.


@dataclass
class KeyPoints:
    """Biểu diễn các điểm chính được trích xuất từ bài báo."""
    claims: List[Claim]
    methods: List[Method]
    datasets: List[Dataset]
    novelty: Optional[str] = None
    limitations: Optional[str] = None


class KeyPointExtractor:
    """
    Trích xuất các điểm chính từ bài báo để giúp phản biện nhanh chóng hiểu nội dung.
    """
    
    def __init__(self):
        self.model_manager = get_model_manager()
        self.redaction_service = get_redaction_service()
    
    async def extract_keypoints(
        self,
        title: str,
        abstract: str,
        language: str = "en"
    ) -> KeyPoints:
        """
        Trích xuất các điểm chính từ tiêu đề và tóm tắt bài báo.
        
        Args:
            title: Tiêu đề bài báo
            abstract: Tóm tắt bài báo
            language: Mã ngôn ngữ ("en" hoặc "vi")
            
        Returns:
            Đối tượng KeyPoints với thông tin được trích xuất
        """
        if not title or not abstract:
            raise ValueError("Tiêu đề và tóm tắt là bắt buộc")
        
        # Xác thực độ dài input
        if len(abstract) > 2000:
            raise ValueError("Tóm tắt quá dài. Tối đa 2000 ký tự.")
        
        # Loại bỏ thông tin cá nhân trước khi xử lý
        redaction_result = self.redaction_service.anonymize_paper_content(
            text=f"{title}\n\n{abstract}",
            redact_emails=True,
            redact_urls=False,
            redact_phones=True
        )
        
        redacted_text = redaction_result.redacted_text
        
        try:
            system_instruction = self._get_keypoint_system_prompt(language)
            prompt = self._build_keypoint_prompt(title, abstract, language)
            
            response = await self.model_manager.call_llm(
                prompt=prompt,
                system_instruction=system_instruction,
                model="gpt-4o-mini",
                temperature=0.2  # Nhiệt độ thấp cho trích xuất theo sự thật
            )
            
            result = self._parse_keypoint_response(response, language)
            
            logger.info(
                f"Extracted key points: {len(result.claims)} claims, "
                f"{len(result.methods)} methods, {len(result.datasets)} datasets"
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Key point extraction failed: {e}", exc_info=True)
            raise
    
    def _get_keypoint_system_prompt(self, language: str) -> str:
        """Lấy system prompt cho trích xuất điểm chính."""
        if language == "vi":
            return """Bạn là một chuyên gia trích xuất thông tin từ bài báo khoa học.
Nhiệm vụ của bạn là trích xuất các điểm chính từ bài báo.

Trả về kết quả dưới dạng JSON:
{{
  "claims": [
    {{"text": "Kết quả chính được tuyên bố", "confidence": 0.92}}
  ],
  "methods": [
    {{"name": "Tên phương pháp", "details": "Chi tiết về phương pháp"}}
  ],
  "datasets": [
    {{"name": "Tên dataset", "usage": "cách sử dụng (training/evaluation/both)"}}
  ],
  "novelty": "Điểm mới của bài báo",
  "limitations": "Hạn chế được đề cập"
}}
Chỉ trả về JSON, không có markdown hay text thêm."""
        else:
            return """You are an expert information extractor for academic papers.
Your task is to extract key points from a research paper.

Return results as JSON:
{{
  "claims": [
    {{"text": "Key claim stated", "confidence": 0.92}}
  ],
  "methods": [
    {{"name": "Method name", "details": "Details about the method"}}
  ],
  "datasets": [
    {{"name": "Dataset name", "usage": "how it's used (training/evaluation/both)"}}
  ],
  "novelty": "Novel contribution of the paper",
  "limitations": "Limitations mentioned"
}}
Return only JSON, no markdown or additional text."""
    
    def _build_keypoint_prompt(
        self,
        title: str,
        abstract: str,
        language: str
    ) -> str:
        """Xây dựng prompt cho trích xuất điểm chính."""
        if language == "vi":
            return f"""Hãy trích xuất các điểm chính từ bài báo sau:

Tiêu đề: {title}

Abstract: {abstract}

Yêu cầu:
- Trích xuất các tuyên bố chính (claims) với độ tin cậy
- Liệt kê các phương pháp được sử dụng
- Liệt kê các dataset được sử dụng
- Xác định điểm mới (novelty)
- Xác định hạn chế (limitations) nếu có
- Trả về JSON như đã hướng dẫn"""
        else:
            return f"""Please extract key points from the following paper:

Title: {title}

Abstract: {abstract}

Requirements:
- Extract main claims with confidence scores
- List methods used
- List datasets used
- Identify novelty
- Identify limitations if mentioned
- Return JSON as instructed"""
    
    def _parse_keypoint_response(
        self,
        response: str,
        language: str
    ) -> KeyPoints:
        """Phân tích phản hồi LLM thành đối tượng KeyPoints."""
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
            
            # Parse claims
            claims = []
            if "claims" in data and isinstance(data["claims"], list):
                for item in data["claims"]:
                    if isinstance(item, dict) and "text" in item:
                        claims.append(Claim(
                            text=item.get("text", ""),
                            confidence=float(item.get("confidence", 0.5))
                        ))
            
            # Parse methods
            methods = []
            if "methods" in data and isinstance(data["methods"], list):
                for item in data["methods"]:
                    if isinstance(item, dict) and "name" in item:
                        methods.append(Method(
                            name=item.get("name", ""),
                            details=item.get("details", "")
                        ))
            
            # Parse datasets
            datasets = []
            if "datasets" in data and isinstance(data["datasets"], list):
                for item in data["datasets"]:
                    if isinstance(item, dict) and "name" in item:
                        datasets.append(Dataset(
                            name=item.get("name", ""),
                            usage=item.get("usage", "unknown")
                        ))
            
            return KeyPoints(
                claims=claims,
                methods=methods,
                datasets=datasets,
                novelty=data.get("novelty"),
                limitations=data.get("limitations")
            )
            
        except (json.JSONDecodeError, KeyError, TypeError, ValueError) as e:
            logger.error(f"Không thể phân tích phản hồi keypoint: {e}")
            logger.debug(f"Phản hồi là: {response[:500]}")
            raise ValueError(f"Không thể phân tích phản hồi AI: {e}")


# Global instance
_keypoint_extractor: Optional[KeyPointExtractor] = None


def get_keypoint_extractor() -> KeyPointExtractor:
    """Lấy hoặc tạo instance toàn cục của KeyPointExtractor."""
    global _keypoint_extractor
    if _keypoint_extractor is None:
        _keypoint_extractor = KeyPointExtractor()
    return _keypoint_extractor


