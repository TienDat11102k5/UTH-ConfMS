# services/llm_client.py
"""
LLM Client (Tương thích ngược)
Sử dụng ModelManager để hỗ trợ Gemini và các model local.
"""
import time
import logging
from typing import Optional
from core.governance.model_manager import get_model_manager
from core.governance.audit_logger import log_ai_usage

logger = logging.getLogger(__name__)

async def call_llm(
    prompt: str, 
    system_instruction: str = "", 
    model: str = None, 
    user_id: str = "system", 
    feature_name: str = "unknown",
    conference_id: Optional[str] = None
):
    """
    Hàm wrapper để gọi LLM với ghi log kiểm toán.
    
    Sử dụng ModelManager để hỗ trợ Gemini và Local models.
    Model mặc định sẽ được lấy từ cấu hình (Settings).
    
    Tham số:
        prompt: Prompt người dùng
        system_instruction: Hướng dẫn hệ thống
        model: Tên mô hình (tùy chọn, mặc định từ cấu hình)
        user_id: Mã người dùng
        feature_name: Tên tính năng để ghi log kiểm toán
        conference_id: Mã hội nghị (tùy chọn)
        
    Trả về:
        Văn bản phản hồi LLM
    """
    start_time = time.time()
    
    try:
        # Sử dụng ModelManager để gọi LLM
        model_manager = get_model_manager()
        result_content = await model_manager.call_llm(
            prompt=prompt,
            system_instruction=system_instruction,
            model=model,
            temperature=0.3,  # Giữ nhiệt độ thấp để kết quả ổn định
            conference_id=conference_id,
            check_rate_limit=True
        )
        
        # Lấy model name thực tế được sử dụng
        actual_model = model or model_manager.settings.model_name
        
        # Ghi log Audit (Yêu cầu quản trị AI)
        await log_ai_usage(
            user_id=user_id,
            feature=feature_name,
            model=actual_model,
            prompt=prompt,
            input_hash="",  # Will be calculated in log_ai_usage
            response=result_content,
            timestamp=time.time(),
            conference_id=conference_id
        )
        
        return result_content

    except Exception as e:
        logger.error(f"Error calling LLM: {str(e)}", exc_info=True)
        raise e