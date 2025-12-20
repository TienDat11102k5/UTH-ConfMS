"""
Dịch vụ Xử lý Lô
Xử lý tạo tóm tắt theo lô cho hội nghị.
"""
import asyncio
import logging
from typing import List, Dict, Optional
from datetime import datetime
from core.nlp.synopsis_generator import get_synopsis_generator
from core.governance.feature_flags import get_feature_flag_manager
from core.governance.audit_logger import get_audit_logger
from core.infra.config import get_settings

logger = logging.getLogger(__name__)


class BatchSynopsisGenerator:
    """
    Tạo tóm tắt cho nhiều bài báo theo lô.
    """
    
    def __init__(self):
        self.generator = get_synopsis_generator()
        self.feature_manager = get_feature_flag_manager()
        self.audit_logger = get_audit_logger()
    
    async def generate_for_conference(
        self,
        conference_id: str,
        paper_metadata_list: List[Dict],
        length: str = "medium",
        max_concurrent: int = 5
    ) -> Dict[str, any]:
        """
        Tạo tóm tắt cho nhiều bài báo trong một hội nghị.
        
        Args:
            conference_id: ID hội nghị
            paper_metadata_list: Danh sách các dict metadata bài báo với các khóa:
                - paper_id
                - title
                - abstract
                - keywords (tùy chọn)
            length: Độ dài tóm tắt
            max_concurrent: Số lượng tạo đồng thời tối đa
            
        Returns:
            Dictionary với kết quả:
            {
                "total": 10,
                "successful": 8,
                "failed": 2,
                "results": [...]
            }
        """
        # Kiểm tra cờ tính năng
        feature_enabled = await self.feature_manager.is_enabled(
            conference_id,
            "synopsis_generation"
        )
        
        if not feature_enabled:
            raise ValueError("Tạo tóm tắt không được bật cho hội nghị này")
        
        semaphore = asyncio.Semaphore(max_concurrent)
        results = []
        successful = 0
        failed = 0
        
        async def generate_one(paper_meta: Dict):
            async with semaphore:
                try:
                    synopsis = await self.generator.generate_synopsis(
                        title=paper_meta["title"],
                        abstract=paper_meta["abstract"],
                        keywords=paper_meta.get("keywords", []),
                        length=length
                    )
                    
                    # Ghi nhật ký kiểm toán
                    await self.audit_logger.log_operation(
                        conference_id=conference_id,
                        user_id="system",
                        feature="synopsis_generation",
                        action="batch_generate_synopsis",
                        prompt=f"Tạo lô cho bài báo {paper_meta.get('paper_id')}",
                        model_id=get_settings().model_name,
                        output_summary=f"Đã tạo tóm tắt {length}: {synopsis.word_count} từ",
                        accepted=None
                    )
                    
                    return {
                        "paper_id": paper_meta.get("paper_id"),
                        "status": "success",
                        "synopsis": synopsis.synopsis,
                        "word_count": synopsis.word_count
                    }
                except Exception as e:
                    logger.error(f"Tạo tóm tắt cho bài báo {paper_meta.get('paper_id')} thất bại: {e}")
                    return {
                        "paper_id": paper_meta.get("paper_id"),
                        "status": "failed",
                        "error": str(e)
                    }
        
        # Tạo tất cả tóm tắt đồng thời
        tasks = [generate_one(paper_meta) for paper_meta in paper_metadata_list]
        results = await asyncio.gather(*tasks)
        
        # Đếm số thành công và thất bại
        for result in results:
            if result["status"] == "success":
                successful += 1
            else:
                failed += 1
        
        logger.info(
            f"Hoàn thành tạo tóm tắt lô: {successful} thành công, {failed} thất bại"
        )
        
        return {
            "total": len(paper_metadata_list),
            "successful": successful,
            "failed": failed,
            "results": results,
            "generated_at": datetime.utcnow().isoformat() + "Z"
        }


# Global instance
_batch_generator: Optional[BatchSynopsisGenerator] = None


def get_batch_generator() -> BatchSynopsisGenerator:
    """Lấy hoặc tạo instance global BatchSynopsisGenerator."""
    global _batch_generator
    if _batch_generator is None:
        _batch_generator = BatchSynopsisGenerator()
    return _batch_generator



