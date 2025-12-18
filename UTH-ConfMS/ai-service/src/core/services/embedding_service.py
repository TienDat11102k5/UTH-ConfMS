"""
Dịch vụ Embedding
Tạo và cache embeddings văn bản cho tính toán độ tương đồng.
"""
import hashlib
import logging
import numpy as np
from typing import List, Optional, Union
import redis
from redis.exceptions import RedisError
from core.governance.model_manager import get_model_manager
from core.infra.config import get_settings
import pickle
import base64

logger = logging.getLogger(__name__)


class EmbeddingService:
    """
    Dịch vụ tạo và cache embeddings văn bản.
    Sử dụng API embeddings của OpenAI với Redis cache.
    """
    
    def __init__(self):
        self.settings = get_settings()
        self.model_manager = get_model_manager()
        self.redis_client: Optional[redis.Redis] = None
        self._init_redis()
        self.embedding_model = "text-embedding-3-small"  # Mô hình embedding của OpenAI
    
    def _init_redis(self) -> None:
        """Khởi tạo kết nối Redis để caching."""
        try:
            redis_url = self.settings.redis_url
            if redis_url:
                self.redis_client = redis.from_url(
                    redis_url,
                    decode_responses=False,  # Chế độ binary cho numpy arrays
                    socket_connect_timeout=2,
                    socket_timeout=2
                )
                self.redis_client.ping()
                logger.info("Đã thiết lập kết nối Redis cho embeddings cache")
        except (RedisError, Exception) as e:
            logger.warning(f"Redis không khả dụng cho embeddings cache: {e}")
            self.redis_client = None
    
    def _get_cache_key(self, text: str) -> str:
        """Tạo khóa cache cho embedding văn bản."""
        text_hash = hashlib.sha256(text.encode('utf-8')).hexdigest()
        return f"embedding:{self.embedding_model}:{text_hash}"
    
    def _serialize_embedding(self, embedding: np.ndarray) -> bytes:
        """Tuần tự hóa numpy array thành bytes để lưu trữ Redis."""
        return base64.b64encode(pickle.dumps(embedding))
    
    def _deserialize_embedding(self, data: bytes) -> np.ndarray:
        """Phi tuần tự hóa bytes thành numpy array từ Redis."""
        return pickle.loads(base64.b64decode(data))
    
    async def generate_embedding(self, text: str) -> np.ndarray:
        """
        Tạo embedding cho một văn bản.
        Sử dụng cache nếu có sẵn.
        
        Args:
            text: Văn bản cần embedding
            
        Returns:
            Numpy array của vector embedding
        """
        if not text or len(text.strip()) == 0:
            raise ValueError("Văn bản không được rỗng")
        
        # Kiểm tra cache trước
        if self.redis_client:
            try:
                cache_key = self._get_cache_key(text)
                cached = self.redis_client.get(cache_key)
                if cached:
                    logger.debug("Truy vấn cache thành công")
                    return self._deserialize_embedding(cached)
            except RedisError as e:
                logger.debug(f"Đọc cache thất bại: {e}")
        
        # Tạo embedding bằng OpenAI
        try:
            # Sử dụng API embeddings của OpenAI
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=self.settings.openai_api_key)
            
            response = await client.embeddings.create(
                model=self.embedding_model,
                input=text
            )
            
            embedding = np.array(response.data[0].embedding, dtype=np.float32)
            
            # Cache trong 7 ngày
            if self.redis_client:
                try:
                    cache_key = self._get_cache_key(text)
                    serialized = self._serialize_embedding(embedding)
                    self.redis_client.setex(cache_key, 7 * 24 * 3600, serialized)  # TTL 7 ngày
                except RedisError as e:
                    logger.warning(f"Không thể cache embedding: {e}")
            
            return embedding
            
        except Exception as e:
            logger.error(f"Tạo embedding thất bại: {e}", exc_info=True)
            raise
    
    async def batch_generate_embeddings(self, texts: List[str]) -> List[np.ndarray]:
        """
        Tạo embeddings cho nhiều văn bản theo lô.
        Sử dụng cache khi có sẵn.
        
        Args:
            texts: Danh sách văn bản cần embedding
            
        Returns:
            Danh sách các numpy arrays (embeddings)
        """
        if not texts:
            return []
        
        embeddings = []
        texts_to_generate = []
        indices_to_generate = []
        
        # Kiểm tra cache cho mỗi văn bản
        for i, text in enumerate(texts):
            if self.redis_client:
                try:
                    cache_key = self._get_cache_key(text)
                    cached = self.redis_client.get(cache_key)
                    if cached:
                        embeddings.append(self._deserialize_embedding(cached))
                        continue
                except RedisError:
                    pass
            
            # Cần tạo mới
            texts_to_generate.append(text)
            indices_to_generate.append(i)
            embeddings.append(None)  # Placeholder
        
        # Tạo embeddings cho các văn bản chưa cache
        if texts_to_generate:
            try:
                from openai import AsyncOpenAI
                client = AsyncOpenAI(api_key=self.settings.openai_api_key)
                
                response = await client.embeddings.create(
                    model=self.embedding_model,
                    input=texts_to_generate
                )
                
                # Điền các embeddings đã tạo
                for idx, embedding_data in zip(indices_to_generate, response.data):
                    embedding = np.array(embedding_data.embedding, dtype=np.float32)
                    embeddings[idx] = embedding
                    
                    # Cache
                    if self.redis_client:
                        try:
                            cache_key = self._get_cache_key(texts[idx])
                            serialized = self._serialize_embedding(embedding)
                            self.redis_client.setex(cache_key, 7 * 24 * 3600, serialized)
                        except RedisError:
                            pass
                            
            except Exception as e:
                logger.error(f"Tạo embeddings theo lô thất bại: {e}", exc_info=True)
                raise
        
        return embeddings
    
    def calculate_cosine_similarity(
        self,
        embedding1: np.ndarray,
        embedding2: np.ndarray
    ) -> float:
        """
        Tính độ tương đồng cosine giữa hai embeddings.
        
        Args:
            embedding1: Vector embedding thứ nhất
            embedding2: Vector embedding thứ hai
            
        Returns:
            Điểm độ tương đồng từ 0 đến 1
        """
        dot_product = np.dot(embedding1, embedding2)
        norm1 = np.linalg.norm(embedding1)
        norm2 = np.linalg.norm(embedding2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        similarity = dot_product / (norm1 * norm2)
        # Đảm bảo kết quả nằm giữa 0 và 1 (cosine similarity có thể từ -1 đến 1)
        return max(0.0, min(1.0, (similarity + 1) / 2))


# Global instance
_embedding_service: Optional[EmbeddingService] = None


def get_embedding_service() -> EmbeddingService:
    """Lấy hoặc tạo instance global EmbeddingService."""
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = EmbeddingService()
    return _embedding_service


