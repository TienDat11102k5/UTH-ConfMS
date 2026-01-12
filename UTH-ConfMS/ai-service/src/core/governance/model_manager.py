"""
Model Manager cho Hỗ Trợ Nhiều Nhà Cung Cấp LLM
Hiện tại tập trung hỗ trợ Gemini và các model local với logic thử lại và giới hạn tốc độ.
Đã loại bỏ OpenAI và Anthropic theo yêu cầu.
"""
import logging
import time
import asyncio
from typing import Optional, Dict, Any
from enum import Enum
from dataclasses import dataclass
import google.generativeai as genai
from core.infra.config import get_settings

logger = logging.getLogger(__name__)


class AIProvider(str, Enum):
    """Các nhà cung cấp AI được hỗ trợ."""
    GEMINI = "gemini"
    LOCAL = "local"


@dataclass
class ModelConfig:
    """Cấu hình cho một model."""
    provider: AIProvider
    model_name: str
    max_tokens: int
    temperature: float
    api_key: Optional[str] = None
    base_url: Optional[str] = None  # Cho local models hoặc custom endpoints


class ModelManager:
    """
    Quản lý các cuộc gọi LLM trên nhiều nhà cung cấp với logic thử lại và giới hạn tốc độ.
    """
    
    def __init__(self):
        self.settings = get_settings()
        self.gemini_client: Optional[genai.GenerativeModel] = None
        self.rate_limits: Dict[str, Dict[str, Any]] = {}  # conference_id -> {count, reset_time}
        self._init_clients()
    
    def _init_clients(self) -> None:
        """Khởi tạo các API client dựa trên cấu hình."""
        provider = self.settings.ai_provider.lower()
        
        if provider == AIProvider.GEMINI.value:
            api_key = self.settings.gemini_api_key
            if api_key:
                genai.configure(api_key=api_key)
                # Khởi tạo model mặc định, sẽ được override trong _call_gemini nếu cần
                model_name = self.settings.model_name or "gemini-1.5-flash"
                self.gemini_client = genai.GenerativeModel(model_name)
                logger.info(f"Gemini client initialized with model: {model_name}")
            else:
                logger.warning("Gemini API key not found")
        
        elif provider == AIProvider.LOCAL.value:
            logger.info("Using local model provider")
        else:
            logger.warning(f"Unknown provider: {provider}, defaulting to Gemini")
            if self.settings.gemini_api_key:
                genai.configure(api_key=self.settings.gemini_api_key)
                model_name = self.settings.model_name or "gemini-1.5-flash"
                self.gemini_client = genai.GenerativeModel(model_name)
                logger.info(f"Gemini client initialized with model: {model_name}")
    
    def _check_rate_limit(self, conference_id: str, max_calls: int = 100, window_seconds: int = 3600) -> bool:
        """
        Kiểm tra xem giới hạn tốc độ có bị vượt quá cho hội nghị hay không.
        
        Args:
            conference_id: Mã hội nghị
            max_calls: Số cuộc gọi tối đa mỗi cửa sổ
            window_seconds: Cửa sổ thời gian tính bằng giây
            
        Returns:
            True nếu trong giới hạn, False nếu vượt quá
        """
        now = time.time()
        
        if conference_id not in self.rate_limits:
            self.rate_limits[conference_id] = {
                "count": 0,
                "reset_time": now + window_seconds
            }
        
        limit_info = self.rate_limits[conference_id]
        
        # Reset nếu cửa sổ hết hạn
        if now > limit_info["reset_time"]:
            limit_info["count"] = 0
            limit_info["reset_time"] = now + window_seconds
        
        # Kiểm tra giới hạn
        if limit_info["count"] >= max_calls:
            logger.warning(f"Rate limit exceeded for conference {conference_id}")
            return False
        
        limit_info["count"] += 1
        return True
    
    async def _call_gemini(
        self,
        prompt: str,
        system_instruction: str,
        model: str,
        max_tokens: int,
        temperature: float
    ) -> str:
        """Gọi Gemini API với logic thử lại."""
        if not self.settings.gemini_api_key:
            raise ValueError("Gemini API key not configured")
        
        max_retries = 3
        base_delay = 1
        
        for attempt in range(max_retries):
            try:
                # Tạo model instance với model name cụ thể
                genai_model = genai.GenerativeModel(model)
                
                # Kết hợp system instruction và prompt
                full_prompt = f"{system_instruction}\n\n{prompt}" if system_instruction else prompt
                
                # Gọi API (Gemini API là synchronous, nên chạy trong executor)
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(
                    None,
                    lambda: genai_model.generate_content(
                        full_prompt,
                        generation_config=genai.types.GenerationConfig(
                            max_output_tokens=max_tokens,
                            temperature=temperature
                        )
                    )
                )
                
                return response.text
                
            except Exception as e:
                if attempt < max_retries - 1:
                    delay = base_delay * (2 ** attempt)  # Exponential backoff
                    logger.warning(f"Cuộc gọi Gemini API thất bại (lần thử {attempt + 1}), thử lại sau {delay}s: {e}")
                    await asyncio.sleep(delay)
                else:
                    logger.error(f"Cuộc gọi Gemini API thất bại sau {max_retries} lần thử: {e}")
                    raise
    
    async def _call_local(
        self,
        prompt: str,
        system_instruction: str,
        model: str,
        max_tokens: int,
        temperature: float
    ) -> str:
        """Gọi local model (placeholder cho triển khai tương lai)."""
        # TODO: Implement local model support (e.g., Ollama, vLLM)
        raise NotImplementedError("Local model support not yet implemented")
    
    async def call_llm(
        self,
        prompt: str,
        system_instruction: str = "",
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        conference_id: Optional[str] = None,
        check_rate_limit: bool = True
    ) -> str:
        """
        Gọi LLM với trừ tượng hóa provider và logic thử lại.
        
        Args:
            prompt: Prompt người dùng
            system_instruction: Chỉ dẫn hệ thống
            model: Tên model (mặc định là model đã cấu hình)
            max_tokens: Số token tối đa (mặc định là giá trị đã cấu hình)
            temperature: Nhiệt độ (mặc định là giá trị đã cấu hình)
            conference_id: Mã hội nghị cho giới hạn tốc độ
            check_rate_limit: Có kiểm tra giới hạn tốc độ hay không
            
        Returns:
            Văn bản phản hồi LLM
        """
        # Kiểm tra giới hạn tốc độ nếu được bật
        if check_rate_limit and conference_id:
            if not self._check_rate_limit(conference_id):
                raise Exception(f"Rate limit exceeded for conference {conference_id}")
        
        # Sử dụng mặc định từ settings nếu không được cung cấp
        model = model or self.settings.model_name
        max_tokens = max_tokens or self.settings.max_tokens
        temperature = temperature if temperature is not None else 0.3
        
        provider = self.settings.ai_provider.lower()
        
        try:
            if provider == AIProvider.GEMINI.value:
                return await self._call_gemini(prompt, system_instruction, model, max_tokens, temperature)
            
            elif provider == AIProvider.LOCAL.value:
                return await self._call_local(prompt, system_instruction, model, max_tokens, temperature)
            
            else:
                # Fallback về Gemini
                logger.warning(f"Nhà cung cấp không xác định {provider}, fallback về Gemini")
                return await self._call_gemini(prompt, system_instruction, model, max_tokens, temperature)
                
        except Exception as e:
            logger.error(f"LLM call failed: {e}")
            raise
    
    def get_provider_info(self) -> Dict[str, Any]:
        """Lấy thông tin về cấu hình provider hiện tại."""
        return {
            "provider": self.settings.ai_provider,
            "model": self.settings.model_name,
            "max_tokens": self.settings.max_tokens,
            "gemini_configured": self.gemini_client is not None and self.settings.gemini_api_key is not None
        }


# Global singleton instance
_model_manager: Optional[ModelManager] = None


def get_model_manager() -> ModelManager:
    """Lấy hoặc tạo instance toàn cục của ModelManager."""
    global _model_manager
    if _model_manager is None:
        _model_manager = ModelManager()
    return _model_manager
