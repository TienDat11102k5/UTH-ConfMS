"""
Bài kiểm thử đơn vị cho Audit Logger
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime, timedelta
from core.governance.audit_logger import AuditLogger


@pytest.fixture
def mock_settings():
    """Cài đặt giả cho kiểm thử."""
    with patch('core.governance.audit_logger.get_settings') as mock:
        settings = Mock()
        settings.database_url = "postgresql://test:test@localhost:5432/test_db"
        mock.return_value = settings
        yield settings


@pytest.fixture
def audit_logger(mock_settings):
    """Tạo `AuditLogger` cho kiểm thử."""
    return AuditLogger()


@pytest.mark.asyncio
async def test_log_operation(audit_logger):
    """Kiểm thử ghi lại một thao tác AI."""
    # Mock database pool
    mock_conn = AsyncMock()
    mock_conn.fetchval = AsyncMock(return_value="123")
    mock_conn.__aenter__ = AsyncMock(return_value=mock_conn)
    mock_conn.__aexit__ = AsyncMock(return_value=None)
    
    mock_pool = Mock()
    mock_pool.acquire = Mock(return_value=mock_conn)
    
    audit_logger.db_pool = mock_pool
    
    log_id = await audit_logger.log_operation(
        conference_id="conf-123",
        user_id="user-456",
        feature="spell_check",
        action="check_spelling",
        prompt="Test prompt",
        model_id="gpt-4o-mini",
        output_summary="Fixed spelling errors"
    )
    
    assert log_id == "123"
    mock_conn.fetchval.assert_called_once()


@pytest.mark.asyncio
async def test_log_operation_with_long_output(audit_logger):
    """Kiểm thử rằng output dài sẽ bị rút gọn (truncate)."""
    # Mock database pool
    mock_conn = AsyncMock()
    mock_conn.fetchval = AsyncMock(return_value="123")
    mock_conn.__aenter__ = AsyncMock(return_value=mock_conn)
    mock_conn.__aexit__ = AsyncMock(return_value=None)
    
    mock_pool = Mock()
    mock_pool.acquire = Mock(return_value=mock_conn)
    
    audit_logger.db_pool = mock_pool
    
    long_output = "x" * 6000  # Longer than 5000 char limit
    
    log_id = await audit_logger.log_operation(
        conference_id="conf-123",
        user_id="user-456",
        feature="spell_check",
        action="check_spelling",
        prompt="Test prompt",
        model_id="gpt-4o-mini",
        output_summary=long_output
    )
    
    assert log_id == "123"
    # Verify truncation happened
    # fetchval is called with: (SQL string, timestamp, conference_id, user_id, feature, action, prompt, model_id, input_hash, output_summary, accepted, metadata)
    # So output_summary is at index 9 (starting from index 1 for first param after SQL)
    call_args = mock_conn.fetchval.call_args
    # call_args[0] is the positional arguments tuple
    # Index 0 is SQL, so output_summary is at index 9
    output_summary = call_args[0][9]
    assert len(output_summary) <= 5000
    assert output_summary.endswith("...")


@pytest.mark.asyncio
async def test_get_usage_stats(audit_logger):
    """Kiểm thử lấy thống kê sử dụng (usage statistics)."""
    # Mock database
    mock_row1 = Mock()
    mock_row1.__getitem__ = Mock(side_effect=lambda key: {
        'feature': 'spell_check',
        'total_calls': 100,
        'accepted_calls': 80,
        'rejected_calls': 15,
        'pending_calls': 5
    }.get(key))
    
    mock_conn = AsyncMock()
    mock_conn.fetch = AsyncMock(return_value=[mock_row1])
    mock_conn.__aenter__ = AsyncMock(return_value=mock_conn)
    mock_conn.__aexit__ = AsyncMock(return_value=None)
    
    mock_pool = Mock()
    mock_pool.acquire = Mock(return_value=mock_conn)
    
    audit_logger.db_pool = mock_pool
    
    stats = await audit_logger.get_usage_stats(
        conference_id="conf-123",
        feature="spell_check"
    )
    
    assert stats["conference_id"] == "conf-123"
    assert len(stats["features"]) > 0
    assert stats["total_calls"] == 100
    assert stats["total_accepted"] == 80


@pytest.mark.asyncio
async def test_get_acceptance_rate(audit_logger):
    """Kiểm thử lấy tỷ lệ chấp nhận (acceptance rate)."""
    # Mock database
    mock_row = Mock()
    mock_row.__getitem__ = Mock(side_effect=lambda key: {
        'total': 100,
        'accepted': 75
    }.get(key))
    
    mock_conn = AsyncMock()
    mock_conn.fetchrow = AsyncMock(return_value=mock_row)
    mock_conn.__aenter__ = AsyncMock(return_value=mock_conn)
    mock_conn.__aexit__ = AsyncMock(return_value=None)
    
    mock_pool = Mock()
    mock_pool.acquire = Mock(return_value=mock_conn)
    
    audit_logger.db_pool = mock_pool
    
    rate = await audit_logger.get_acceptance_rate(
        conference_id="conf-123",
        feature="spell_check",
        days=30
    )
    
    assert rate == 0.75


@pytest.mark.asyncio
async def test_get_audit_logs(audit_logger):
    """Kiểm thử truy xuất nhật ký kiểm toán (audit logs)."""
    # Mock database
    mock_row = Mock()
    mock_row.__getitem__ = Mock(side_effect=lambda key: {
        'id': 1,
        'timestamp': datetime.utcnow(),
        'conference_id': 'conf-123',
        'user_id': 'user-456',
        'feature': 'spell_check',
        'action': 'check_spelling',
        'prompt': 'Test prompt',
        'model_id': 'gpt-4o-mini',
        'input_hash': 'abc123',
        'output_summary': 'Fixed errors',
        'accepted': True,
        'metadata': None
    }.get(key))
    
    mock_conn = AsyncMock()
    mock_conn.fetch = AsyncMock(return_value=[mock_row])
    mock_conn.__aenter__ = AsyncMock(return_value=mock_conn)
    mock_conn.__aexit__ = AsyncMock(return_value=None)
    
    mock_pool = Mock()
    mock_pool.acquire = Mock(return_value=mock_conn)
    
    audit_logger.db_pool = mock_pool
    
    logs = await audit_logger.get_audit_logs(
        conference_id="conf-123",
        limit=10,
        offset=0
    )
    
    assert len(logs) == 1
    assert logs[0]["conference_id"] == "conf-123"
    assert logs[0]["feature"] == "spell_check"


def test_hash_input(audit_logger):
    """Kiểm thử hàm băm (hash) đầu vào."""
    prompt = "Test prompt"
    system_instruction = "You are a helpful assistant"
    
    hash1 = audit_logger._hash_input(prompt, system_instruction)
    hash2 = audit_logger._hash_input(prompt, system_instruction)
    
    # Same input should produce same hash
    assert hash1 == hash2
    assert len(hash1) == 64  # SHA256 produces 64 char hex string
    
    # Different input should produce different hash
    hash3 = audit_logger._hash_input("Different prompt", system_instruction)
    assert hash1 != hash3


