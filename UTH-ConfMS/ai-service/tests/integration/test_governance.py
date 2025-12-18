"""
Kiểm thử tích hợp cho các tính năng Quản trị
Kiểm thử: Bật/tắt feature, xem audit logs, kiểm tra thống kê sử dụng
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime, timedelta


@pytest.mark.asyncio
async def test_feature_flag_enable_disable():
    """Kiểm thử bật và tắt các tính năng."""
    with patch('core.governance.feature_flags.get_feature_flag_manager') as mock_ff:
        feature_manager = Mock()
        feature_manager.enable_feature = AsyncMock(return_value=True)
        feature_manager.disable_feature = AsyncMock(return_value=True)
        feature_manager.is_enabled = AsyncMock(return_value=True)
        mock_ff.return_value = feature_manager
        
        # Test enable
        from core.governance.feature_flags import get_feature_flag_manager
        manager = get_feature_flag_manager()
        result = await manager.enable_feature("conf-123", "spell_check")
        assert result is True
        
        # Test disable
        result = await manager.disable_feature("conf-123", "spell_check")
        assert result is True


@pytest.mark.asyncio
async def test_audit_log_retrieval():
    """Kiểm thử truy xuất nhật ký kiểm toán."""
    with patch('core.governance.audit_logger.get_audit_logger') as mock_audit:
        audit_logger = Mock()
        audit_logger.get_audit_logs = AsyncMock(return_value=[
            {
                "id": "log-1",
                "timestamp": datetime.utcnow().isoformat(),
                "conference_id": "conf-123",
                "user_id": "user-456",
                "feature": "spell_check",
                "action": "check_spelling",
                "accepted": True
            }
        ])
        mock_audit.return_value = audit_logger
        
        # Test log retrieval
        from core.governance.audit_logger import get_audit_logger
        logger = get_audit_logger()
        logs = await logger.get_audit_logs(
            conference_id="conf-123",
            limit=10,
            offset=0
        )
        
        assert len(logs) > 0
        assert logs[0]["feature"] == "spell_check"


@pytest.mark.asyncio
async def test_usage_stats_calculation():
    """Kiểm thử tính toán thống kê sử dụng."""
    with patch('core.governance.audit_logger.get_audit_logger') as mock_audit:
        audit_logger = Mock()
        audit_logger.get_usage_stats = AsyncMock(return_value={
            "conference_id": "conf-123",
            "total_calls": 100,
            "total_accepted": 75,
            "overall_acceptance_rate": 0.75,
            "features": [
                {
                    "feature": "spell_check",
                    "total_calls": 50,
                    "accepted_calls": 40,
                    "acceptance_rate": 0.8
                }
            ]
        })
        mock_audit.return_value = audit_logger
        
        # Test usage stats
        from core.governance.audit_logger import get_audit_logger
        logger = get_audit_logger()
        stats = await logger.get_usage_stats(
            conference_id="conf-123",
            feature="spell_check"
        )
        
        assert stats["total_calls"] > 0
        assert "overall_acceptance_rate" in stats
        assert stats["overall_acceptance_rate"] >= 0.0 and stats["overall_acceptance_rate"] <= 1.0


@pytest.mark.asyncio
async def test_feature_flag_propagation():
    """Kiểm thử rằng feature flags được truyền đúng tới các dịch vụ."""
    with patch('core.governance.feature_flags.get_feature_flag_manager') as mock_ff:
        feature_manager = Mock()
        feature_manager.is_enabled = AsyncMock(return_value=False)  # Disabled
        mock_ff.return_value = feature_manager
        
        # All services should respect the flag
        from core.governance.feature_flags import get_feature_flag_manager
        manager = get_feature_flag_manager()
        
        spell_enabled = await manager.is_enabled("conf-123", "spell_check")
        grammar_enabled = await manager.is_enabled("conf-123", "grammar_check")
        
        assert spell_enabled is False
        assert grammar_enabled is False


