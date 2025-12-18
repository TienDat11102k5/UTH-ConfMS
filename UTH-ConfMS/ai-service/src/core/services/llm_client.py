# services/llm_client.py
"""
LLM Client Cũ (Tương thích ngược)
Lưu ý: Nên sử dụng core.governance.model_manager.get_model_manager() cho code mới.
"""
import os
import time
import logging
from typing import Optional
from openai import AsyncOpenAI
from core.governance.audit_logger import log_ai_usage

logger = logging.getLogger(__name__)

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def call_llm(
    prompt: str, 
    system_instruction: str = "", 
    model: str = "gpt-4o-mini", 
    user_id: str = "system", 
    feature_name: str = "unknown",
    conference_id: Optional[str] = None
):
    """
    Hàm wrapper cũ để gọi LLM với ghi log kiểm toán.
    
    Lưu ý: Được duy trì để tương thích ngược.
    Đối với code mới, hãy sử dụng core.governance.model_manager.get_model_manager()
    
    Tham số:
        prompt: Prompt người dùng
        system_instruction: Hướng dẫn hệ thống
        model: Tên mô hình
        user_id: Mã người dùng
        feature_name: Tên tính năng để ghi log kiểm toán
        conference_id: Mã hội nghị (tùy chọn)
        
    Trả về:
        Văn bản phản hồi LLM
    """
    start_time = time.time()
    
    try:
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3  # Giữ nhiệt độ thấp để kết quả ổn định
        )
        
        result_content = response.choices[0].message.content
        
        # Ghi log Audit (Yêu cầu quản trị AI)
        await log_ai_usage(
            user_id=user_id,
            feature=feature_name,
            model=model,
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