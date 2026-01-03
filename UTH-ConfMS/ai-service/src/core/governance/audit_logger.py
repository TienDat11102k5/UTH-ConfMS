"""
Ghi nhật ký kiểm toán cho các thao tác AI
Theo dõi tất cả các thao tác AI với đầy đủ audit trail cho quản trị và tuân thủ.
"""
import hashlib
import logging
from typing import Optional, Dict, List, Any
from datetime import datetime, timedelta
import asyncpg
from core.infra.config import get_settings

logger = logging.getLogger(__name__)


class AuditLogger:
    """
    Ghi nhật ký tất cả các thao tác AI vào PostgreSQL cho audit trail và tuân thủ.
    """
    
    def __init__(self):
        self.settings = get_settings()
        self.db_pool: Optional[asyncpg.Pool] = None
    
    async def _init_db_pool(self) -> None:
        """Khởi tạo connection pool PostgreSQL."""
        if self.db_pool is None:
            try:
                self.db_pool = await asyncpg.create_pool(
                    self.settings.database_url,
                    min_size=1,
                    max_size=10,
                    command_timeout=10
                )
                logger.info("PostgreSQL pool đã được tạo cho audit logging")
            except Exception as e:
                logger.error(f"Không thể tạo database pool: {e}")
                raise
    
    def _hash_input(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        """Tạo SHA256 hash của input để deduplication và tracking."""
        content = (system_instruction or "") + prompt
        return hashlib.sha256(content.encode('utf-8')).hexdigest()
    
    async def log_operation(
        self,
        conference_id: str,
        user_id: str,
        feature: str,
        action: str,
        prompt: str,
        model_id: str,
        output_summary: str,
        system_instruction: Optional[str] = None,
        accepted: Optional[bool] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[str]:
        """
        Ghi nhật ký một thao tác AI vào audit trail.
        
        Args:
            conference_id: ID của hội nghị
            user_id: ID của người dùng đã kích hoạt thao tác
            feature: Tên tính năng AI (ví dụ: "spell_check")
            action: Hành động đã thực hiện (ví dụ: "check_spelling", "generate_summary")
            prompt: Prompt của người dùng hoặc input text
            model_id: Định danh model LLM (ví dụ: "gpt-4o-mini")
            output_summary: Tóm tắt output của AI (bị cắt nếu quá dài)
            system_instruction: System instruction tùy chọn
            accepted: Người dùng có chấp nhận đề xuất AI không
            metadata: Metadata bổ sung tùy chọn dưới dạng JSON
            
        Returns:
            ID của log entry nếu thành công, None nếu không
        """
        try:
            await self._init_db_pool()
            
            input_hash = self._hash_input(prompt, system_instruction)
            timestamp = datetime.utcnow()
            
            # Cắt output_summary nếu quá dài (tối đa 5000 ký tự)
            if len(output_summary) > 5000:
                output_summary = output_summary[:4997] + "..."
            
            # Cắt prompt nếu quá dài (tối đa 10000 ký tự)
            truncated_prompt = prompt[:10000] if len(prompt) > 10000 else prompt
            
            async with self.db_pool.acquire() as conn:
                log_id = await conn.fetchval("""
                    INSERT INTO ai_audit_logs (
                        timestamp, conference_id, user_id, feature, action,
                        prompt, model_id, input_hash, output_summary, accepted, metadata
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    RETURNING id
                """, 
                    timestamp,
                    conference_id,
                    user_id,
                    feature,
                    action,
                    truncated_prompt,
                    model_id,
                    input_hash,
                    output_summary,
                    accepted,
                    metadata
                )
                
                logger.debug(f"Audit log đã được tạo: {log_id} cho feature {feature}")
                return str(log_id)
                
        except Exception as e:
            logger.error(f"Không thể ghi nhật ký thao tác AI: {e}", exc_info=True)
            return None
    
    async def get_usage_stats(
        self,
        conference_id: str,
        feature: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Lấy thống kê sử dụng cho một hội nghị.
        
        Args:
            conference_id: ID của hội nghị
            feature: Tên tính năng tùy chọn để lọc
            start_date: Ngày bắt đầu tùy chọn để lọc
            end_date: Ngày kết thúc tùy chọn để lọc
            
        Returns:
            Dictionary chứa thống kê sử dụng
        """
        try:
            await self._init_db_pool()
            
            # Mặc định là 30 ngày gần nhất nếu không chỉ định khoảng thời gian
            if not start_date:
                start_date = datetime.utcnow() - timedelta(days=30)
            if not end_date:
                end_date = datetime.utcnow()
            
            async with self.db_pool.acquire() as conn:
                # Xây dựng query với filter tính năng tùy chọn
                query = """
                    SELECT 
                        feature,
                        COUNT(*) as total_calls,
                        COUNT(CASE WHEN accepted = true THEN 1 END) as accepted_calls,
                        COUNT(CASE WHEN accepted = false THEN 1 END) as rejected_calls,
                        COUNT(CASE WHEN accepted IS NULL THEN 1 END) as pending_calls
                    FROM ai_audit_logs
                    WHERE conference_id = $1
                        AND timestamp >= $2
                        AND timestamp <= $3
                """
                params = [conference_id, start_date, end_date]
                
                if feature:
                    query += " AND feature = $4"
                    params.append(feature)
                
                query += " GROUP BY feature"
                
                rows = await conn.fetch(query, *params)
                
                stats = {
                    "conference_id": conference_id,
                    "period": {
                        "start": start_date.isoformat(),
                        "end": end_date.isoformat()
                    },
                    "features": []
                }
                
                total_all = 0
                accepted_all = 0
                
                for row in rows:
                    feature_stats = {
                        "feature": row['feature'],
                        "total_calls": row['total_calls'],
                        "accepted_calls": row['accepted_calls'],
                        "rejected_calls": row['rejected_calls'],
                        "pending_calls": row['pending_calls'],
                        "acceptance_rate": (
                            row['accepted_calls'] / row['total_calls'] 
                            if row['total_calls'] > 0 else 0.0
                        )
                    }
                    stats["features"].append(feature_stats)
                    total_all += row['total_calls']
                    accepted_all += row['accepted_calls']
                
                stats["total_calls"] = total_all
                stats["total_accepted"] = accepted_all
                stats["overall_acceptance_rate"] = (
                    accepted_all / total_all if total_all > 0 else 0.0
                )
                
                return stats
                
        except Exception as e:
            logger.error(f"Không thể lấy thống kê sử dụng: {e}")
            return {
                "conference_id": conference_id,
                "error": str(e),
                "features": []
            }
    
    async def get_acceptance_rate(
        self,
        conference_id: str,
        feature: Optional[str] = None,
        days: int = 30
    ) -> float:
        """
        Lấy tỷ lệ chấp nhận cho một hội nghị/tính năng.
        
        Args:
            conference_id: ID của hội nghị
            feature: Tên tính năng tùy chọn
            days: Số ngày để xem lại
            
        Returns:
            Tỷ lệ chấp nhận dưới dạng float (0.0 đến 1.0)
        """
        try:
            await self._init_db_pool()
            
            start_date = datetime.utcnow() - timedelta(days=days)
            
            async with self.db_pool.acquire() as conn:
                query = """
                    SELECT 
                        COUNT(*) as total,
                        COUNT(CASE WHEN accepted = true THEN 1 END) as accepted
                    FROM ai_audit_logs
                    WHERE conference_id = $1
                        AND timestamp >= $2
                        AND accepted IS NOT NULL
                """
                params = [conference_id, start_date]
                
                if feature:
                    query += " AND feature = $3"
                    params.append(feature)
                
                row = await conn.fetchrow(query, *params)
                
                if row and row['total'] > 0:
                    return row['accepted'] / row['total']
                return 0.0
                
        except Exception as e:
            logger.error(f"Không thể lấy tỷ lệ chấp nhận: {e}")
            return 0.0
    
    async def get_audit_logs(
        self,
        conference_id: Optional[str] = None,
        user_id: Optional[str] = None,
        feature: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Lấy audit logs với filtering.
        
        Args:
            conference_id: Filter ID hội nghị tùy chọn
            user_id: Filter ID người dùng tùy chọn
            feature: Filter tên tính năng tùy chọn
            limit: Số lượng bản ghi tối đa để trả về
            offset: Offset cho pagination
            
        Returns:
            Danh sách các audit log entries
        """
        try:
            await self._init_db_pool()
            
            conditions = []
            params = []
            param_idx = 1
            
            if conference_id:
                conditions.append(f"conference_id = ${param_idx}")
                # Convert to int for database comparison
                params.append(int(conference_id) if isinstance(conference_id, str) else conference_id)
                param_idx += 1
            
            if user_id:
                conditions.append(f"user_id = ${param_idx}")
                # Convert to int for database comparison
                params.append(int(user_id) if isinstance(user_id, str) else user_id)
                param_idx += 1
            
            if feature:
                conditions.append(f"feature = ${param_idx}")
                params.append(feature)
                param_idx += 1
            
            where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
            
            query = f"""
                SELECT 
                    l.id, l.timestamp, l.conference_id, l.user_id, l.feature, l.action,
                    l.prompt, l.model_id, l.input_hash, l.output_summary, l.accepted, l.metadata,
                    u.full_name as user_name, u.email as user_email
                FROM ai_audit_logs l
                LEFT JOIN users u ON l.user_id = u.id
                {where_clause}
                ORDER BY l.timestamp DESC
                LIMIT ${param_idx} OFFSET ${param_idx + 1}
            """
            params.extend([limit, offset])
            
            async with self.db_pool.acquire() as conn:
                rows = await conn.fetch(query, *params)
                
                logs = []
                for row in rows:
                    logs.append({
                        "id": str(row['id']),
                        "timestamp": row['timestamp'].isoformat(),
                        "conference_id": str(row['conference_id']) if row['conference_id'] else None,
                        "user_id": str(row['user_id']) if row['user_id'] else None,
                        "user_name": row['user_name'] if row['user_name'] else None,
                        "user_email": row['user_email'] if row['user_email'] else None,
                        "feature": row['feature'],
                        "action": row['action'],
                        "prompt": row['prompt'],
                        "model_id": row['model_id'],
                        "input_hash": row['input_hash'],
                        "output_summary": row['output_summary'],
                        "accepted": row['accepted'],
                        "metadata": row['metadata']
                    })
                
                return logs
                
        except Exception as e:
            logger.error(f"Không thể lấy audit logs: {e}", exc_info=True)
            return []
    
    async def close(self) -> None:
        """Đóng kết nối database."""
        if self.db_pool:
            await self.db_pool.close()


# Instance singleton toàn cục
_audit_logger: Optional[AuditLogger] = None


def get_audit_logger() -> AuditLogger:
    """Lấy hoặc tạo instance AuditLogger toàn cục."""
    global _audit_logger
    if _audit_logger is None:
        _audit_logger = AuditLogger()
    return _audit_logger


# Alias cho backward compatibility với code hiện có
async def log_ai_usage(
    user_id: str,
    feature: str,
    model: str,
    prompt: str,
    input_hash: str,
    response: str,
    timestamp: float,
    conference_id: Optional[str] = None,
    action: Optional[str] = None,
    accepted: Optional[bool] = None
) -> None:
    """
    Hàm legacy để ghi nhật ký sử dụng AI (backward compatibility).
    
    Args:
        user_id: ID người dùng
        feature: Tên tính năng
        model: Tên model
        prompt: Prompt của người dùng
        input_hash: Hash của input
        response: Phản hồi AI
        timestamp: Unix timestamp
        conference_id: ID hội nghị tùy chọn
        action: Tên hành động tùy chọn
        accepted: Có được chấp nhận không
    """
    logger_instance = get_audit_logger()
    await logger_instance.log_operation(
        conference_id=conference_id or "unknown",
        user_id=user_id,
        feature=feature,
        action=action or "unknown",
        prompt=prompt,
        model_id=model,
        output_summary=response[:5000] if len(response) > 5000 else response,
        accepted=accepted
    )

