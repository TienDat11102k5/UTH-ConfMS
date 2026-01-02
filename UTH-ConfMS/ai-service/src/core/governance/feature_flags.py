"""
Quản lý Feature Flag cho AI Service
Hỗ trợ feature flags theo hội nghị với Redis caching và PostgreSQL persistence.
"""
import os
import logging
from typing import Optional, Dict, List
from datetime import datetime
import redis
from redis.exceptions import RedisError
import asyncpg
from core.infra.config import get_settings

logger = logging.getLogger(__name__)

# Tất cả các tính năng AI có sẵn
# Tên phải khớp với backend Java AIProxyService
AVAILABLE_FEATURES = [
    "grammar_check",           # Author: Kiểm tra ngữ pháp
    "polish_content",          # Author: Đánh bóng nội dung (abstract/title)
    "keyword_suggestion",      # Author: Gợi ý từ khóa
    "paper_synopsis",          # Reviewer: Tóm tắt bài báo
    "reviewer_similarity",     # Chair: Độ tương đồng reviewer-paper
    "assignment_suggestion",   # Chair: Gợi ý phân công reviewer
    "decision_recommendation", # Chair: Gợi ý quyết định accept/reject
    "review_summary",          # Chair: Tóm tắt các review
    "email_draft"              # Chair: Soạn email thông báo
]


class FeatureFlagManager:
    """
    Quản lý feature flags theo hội nghị với Redis caching và PostgreSQL fallback.
    """
    
    def __init__(self):
        self.settings = get_settings()
        self.redis_client: Optional[redis.Redis] = None
        self.db_pool: Optional[asyncpg.Pool] = None
        self._init_redis()
    
    def _init_redis(self) -> None:
        """Khởi tạo kết nối Redis nếu có sẵn."""
        try:
            redis_url = self.settings.redis_url
            if redis_url:
                self.redis_client = redis.from_url(
                    redis_url,
                    decode_responses=True,
                    socket_connect_timeout=2,
                    socket_timeout=2
                )
                # Kiểm tra kết nối
                self.redis_client.ping()
                logger.info("Kết nối Redis đã được thiết lập cho feature flags")
        except (RedisError, Exception) as e:
            logger.warning(f"Redis không khả dụng, chỉ sử dụng PostgreSQL: {e}")
            self.redis_client = None
    
    async def _init_db_pool(self) -> None:
        """Khởi tạo connection pool PostgreSQL."""
        if self.db_pool is None:
            try:
                self.db_pool = await asyncpg.create_pool(
                    self.settings.database_url,
                    min_size=1,
                    max_size=5,
                    command_timeout=5
                )
                logger.info("PostgreSQL pool đã được tạo cho feature flags")
            except Exception as e:
                logger.error(f"Không thể tạo database pool: {e}")
                raise
    
    def _get_redis_key(self, conference_id: str, feature_name: str) -> str:
        """Tạo Redis key cho feature flag."""
        return f"feature_flag:{conference_id}:{feature_name}"
    
    async def enable_feature(
        self, 
        conference_id: str, 
        feature_name: str,
        user_id: Optional[str] = None
    ) -> bool:
        """
        Bật một tính năng cho hội nghị.
        
        Args:
            conference_id: ID của hội nghị
            feature_name: Tên tính năng (phải có trong AVAILABLE_FEATURES)
            user_id: ID người dùng đã bật tính năng (tùy chọn)
            
        Returns:
            True nếu bật thành công, False nếu không
        """
        if feature_name not in AVAILABLE_FEATURES:
            logger.warning(f"Tên tính năng không hợp lệ: {feature_name}")
            return False
        
        try:
            # Convert conference_id to int for database query
            conf_id = int(conference_id) if isinstance(conference_id, str) else conference_id
            
            # Cập nhật PostgreSQL
            await self._init_db_pool()
            async with self.db_pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO ai_feature_flags (conference_id, feature_name, enabled, updated_at)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (conference_id, feature_name)
                    DO UPDATE SET enabled = $3, updated_at = $4
                """, conf_id, feature_name, True, datetime.utcnow())
            
            # Cập nhật Redis cache
            if self.redis_client:
                try:
                    key = self._get_redis_key(conference_id, feature_name)
                    self.redis_client.setex(key, 3600, "1")  # Cache trong 1 giờ
                except RedisError as e:
                    logger.warning(f"Không thể cập nhật Redis cache: {e}")
            
            logger.info(f"Tính năng {feature_name} đã được bật cho hội nghị {conference_id}")
            return True
            
        except Exception as e:
            logger.error(f"Không thể bật tính năng {feature_name}: {e}")
            return False
    
    async def disable_feature(
        self, 
        conference_id: str, 
        feature_name: str,
        user_id: Optional[str] = None
    ) -> bool:
        """
        Tắt một tính năng cho hội nghị.
        
        Args:
            conference_id: ID của hội nghị
            feature_name: Tên tính năng
            user_id: ID người dùng đã tắt tính năng (tùy chọn)
            
        Returns:
            True nếu tắt thành công, False nếu không
        """
        try:
            # Convert conference_id to int for database query
            conf_id = int(conference_id) if isinstance(conference_id, str) else conference_id
            
            # Cập nhật PostgreSQL
            await self._init_db_pool()
            async with self.db_pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO ai_feature_flags (conference_id, feature_name, enabled, updated_at)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (conference_id, feature_name)
                    DO UPDATE SET enabled = $3, updated_at = $4
                """, conf_id, feature_name, False, datetime.utcnow())
            
            # Cập nhật Redis cache
            if self.redis_client:
                try:
                    key = self._get_redis_key(conference_id, feature_name)
                    self.redis_client.setex(key, 3600, "0")
                except RedisError as e:
                    logger.warning(f"Không thể cập nhật Redis cache: {e}")
            
            logger.info(f"Tính năng {feature_name} đã được tắt cho hội nghị {conference_id}")
            return True
            
        except Exception as e:
            logger.error(f"Không thể tắt tính năng {feature_name}: {e}")
            return False
    
    async def is_enabled(self, conference_id: str, feature_name: str) -> bool:
        """
        Kiểm tra xem một tính năng có được bật cho hội nghị không.
        
        Args:
            conference_id: ID của hội nghị
            feature_name: Tên tính năng
            
        Returns:
            True nếu được bật, False nếu không
        """
        # Thử Redis trước
        if self.redis_client:
            try:
                key = self._get_redis_key(conference_id, feature_name)
                cached = self.redis_client.get(key)
                if cached is not None:
                    return cached == "1"
            except RedisError as e:
                logger.debug(f"Redis cache miss: {e}")
        
        # Fallback về PostgreSQL
        try:
            # Convert conference_id to int for database query
            conf_id = int(conference_id) if isinstance(conference_id, str) else conference_id
            
            await self._init_db_pool()
            async with self.db_pool.acquire() as conn:
                row = await conn.fetchrow("""
                    SELECT enabled FROM ai_feature_flags
                    WHERE conference_id = $1 AND feature_name = $2
                """, conf_id, feature_name)
                
                if row:
                    enabled = row['enabled']
                    # Cache vào Redis cho lần sau
                    if self.redis_client:
                        try:
                            key = self._get_redis_key(conference_id, feature_name)
                            self.redis_client.setex(key, 3600, "1" if enabled else "0")
                        except RedisError:
                            pass
                    return enabled
                
                # Mặc định: tính năng bị tắt nếu không được bật rõ ràng
                return False
                
        except Exception as e:
            logger.error(f"Không thể kiểm tra feature flag: {e}")
            # Fail-safe: trả về False nếu database không khả dụng
            return False
    
    async def get_all_features(self, conference_id: str) -> Dict[str, bool]:
        """
        Lấy tất cả feature flags cho một hội nghị.
        
        Args:
            conference_id: ID của hội nghị
            
        Returns:
            Dictionary ánh xạ tên tính năng đến trạng thái enabled
        """
        try:
            await self._init_db_pool()
            # Convert conference_id to int for database query
            conf_id = int(conference_id) if isinstance(conference_id, str) else conference_id
            
            async with self.db_pool.acquire() as conn:
                rows = await conn.fetch("""
                    SELECT feature_name, enabled FROM ai_feature_flags
                    WHERE conference_id = $1
                """, conf_id)
                
                # CHỈ trả về features có trong database
                result = {}
                for row in rows:
                    feature_name = row['feature_name']
                    # Chỉ thêm nếu feature_name nằm trong AVAILABLE_FEATURES
                    if feature_name in AVAILABLE_FEATURES:
                        result[feature_name] = row['enabled']
                
                return result
                
        except Exception as e:
            logger.error(f"Không thể lấy tất cả features: {e}")
            return {}
    
    async def close(self) -> None:
        """Đóng kết nối database."""
        if self.db_pool:
            await self.db_pool.close()
        if self.redis_client:
            self.redis_client.close()


# Instance singleton toàn cục
_feature_flag_manager: Optional[FeatureFlagManager] = None


def get_feature_flag_manager() -> FeatureFlagManager:
    """Lấy hoặc tạo instance FeatureFlagManager toàn cục."""
    global _feature_flag_manager
    if _feature_flag_manager is None:
        _feature_flag_manager = FeatureFlagManager()
    return _feature_flag_manager

