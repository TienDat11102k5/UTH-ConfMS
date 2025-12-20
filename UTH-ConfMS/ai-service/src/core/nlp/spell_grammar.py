# nlp/spell_grammar.py
from core.services.llm_client import call_llm
import json

async def check_grammar_and_polish(text: str, user_id: str):
    system_prompt = """
    Bạn là một trợ lý biên tập học thuật chuyên nghiệp. Nhiệm vụ của bạn là:
    1. Kiểm tra chính tả và ngữ pháp.
    2. Đề xuất phiên bản "đánh bóng" (polished) học thuật hơn cho Abstract/Title.
    3. Trả về kết quả dưới dạng JSON (không markdown) với cấu trúc:
    {
        "original": "text gốc",
        "corrected": "text đã sửa lỗi",
        "polished": "text đã đánh bóng (nâng cao)",
        "changes_summary": ["Giải thích ngắn gọn tại sao sửa lỗi này (tiếng Việt)"],
        "suggested_keywords": ["keyword1", "keyword2"]
    }
    """
    
    response = await call_llm(
        prompt=text, 
        system_instruction=system_prompt, 
        user_id=user_id, 
        feature_name="author_grammar_check"
    )
    
    # Parse JSON từ string trả về của LLM
    try:
        return json.loads(response)
    except json.JSONDecodeError:
        return {"error": "Không thể phân tích phản hồi AI", "raw": response}