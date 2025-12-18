"""
Bài kiểm thử đơn vị cho Feature Flag Manager
"""
import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch
from core.governance.feature_flags import FeatureFlagManager, AVAILABLE_FEATURES


@pytest.fixture
def mock_settings():
    """Cài đặt giả cho kiểm thử."""
    with patch('core.governance.feature_flags.get_settings') as mock:
        settings = Mock()
        settings.redis_url = "redis://localhost:6379"
        settings.database_url = "postgresql://test:test@localhost:5432/test_db"
        settings.feature_flags_cache_ttl = 3600
        mock.return_value = settings
        yield settings


@pytest.fixture
def feature_flag_manager(mock_settings):
    """Tạo instance `FeatureFlagManager` cho kiểm thử."""
    with patch('redis.from_url') as mock_redis:
        mock_redis_client = Mock()
        mock_redis_client.ping.return_value = True
        mock_redis_client.get.return_value = None
        mock_redis_client.setex.return_value = True
        mock_redis.return_value = mock_redis_client
        
        manager = FeatureFlagManager()
        manager.redis_client = mock_redis_client
        return manager


@pytest.mark.asyncio
async def test_enable_feature(feature_flag_manager):
    """Kiểm thử bật một tính năng."""
    # Mock database pool
    mock_conn = AsyncMock()
    mock_conn.execute = AsyncMock()
    mock_conn.__aenter__ = AsyncMock(return_value=mock_conn)
    mock_conn.__aexit__ = AsyncMock(return_value=None)
    
    mock_pool = Mock()
    mock_pool.acquire = Mock(return_value=mock_conn)
    
    feature_flag_manager.db_pool = mock_pool
    
    # Test enable feature
    result = await feature_flag_manager.enable_feature(
        conference_id="123",
        feature_name="spell_check"
    )
    
    assert result is True
    mock_conn.execute.assert_called_once()


@pytest.mark.asyncio
async def test_disable_feature(feature_flag_manager):
    """Kiểm thử tắt một tính năng."""
    # Mock database pool
    mock_conn = AsyncMock()
    mock_conn.execute = AsyncMock()
    mock_conn.__aenter__ = AsyncMock(return_value=mock_conn)
    mock_conn.__aexit__ = AsyncMock(return_value=None)
    
    mock_pool = Mock()
    mock_pool.acquire = Mock(return_value=mock_conn)
    
    feature_flag_manager.db_pool = mock_pool
    
    # Test disable feature
    result = await feature_flag_manager.disable_feature(
        conference_id="123",
        feature_name="spell_check"
    )
    
    assert result is True
    mock_conn.execute.assert_called_once()


@pytest.mark.asyncio
async def test_is_enabled_with_redis_cache(feature_flag_manager):
    """Kiểm thử kiểm tra feature flag khi cache Redis trả về giá trị."""
    # Mock Redis returning enabled
    feature_flag_manager.redis_client.get.return_value = "1"
    
    result = await feature_flag_manager.is_enabled("123", "spell_check")
    
    assert result is True
    feature_flag_manager.redis_client.get.assert_called_once()


@pytest.mark.asyncio
async def test_is_enabled_with_database_fallback(feature_flag_manager):
    """Kiểm thử kiểm tra feature flag khi fallback xuống database."""
    # Mock Redis cache miss
    feature_flag_manager.redis_client.get.return_value = None
    
    # Mock database
    mock_row = Mock()
    mock_row.__getitem__ = Mock(side_effect=lambda key: True if key == 'enabled' else None)
    
    mock_conn = AsyncMock()
    mock_conn.fetchrow = AsyncMock(return_value=mock_row)
    mock_conn.__aenter__ = AsyncMock(return_value=mock_conn)
    mock_conn.__aexit__ = AsyncMock(return_value=None)
    
    mock_pool = Mock()
    mock_pool.acquire = Mock(return_value=mock_conn)
    
    feature_flag_manager.db_pool = mock_pool
    
    result = await feature_flag_manager.is_enabled("123", "spell_check")
    
    assert result is True
    mock_conn.fetchrow.assert_called_once()


@pytest.mark.asyncio
async def test_get_all_features(feature_flag_manager):
    """Kiểm thử lấy tất cả các feature cho một hội nghị."""
    # Mock database
    mock_row1 = Mock()
    mock_row1.__getitem__ = Mock(side_effect=lambda key: "spell_check" if key == 'feature_name' else True if key == 'enabled' else None)
    
    mock_row2 = Mock()
    mock_row2.__getitem__ = Mock(side_effect=lambda key: "grammar_check" if key == 'feature_name' else False if key == 'enabled' else None)
    
    mock_conn = AsyncMock()
    mock_conn.fetch = AsyncMock(return_value=[mock_row1, mock_row2])
    mock_conn.__aenter__ = AsyncMock(return_value=mock_conn)
    mock_conn.__aexit__ = AsyncMock(return_value=None)
    
    mock_pool = Mock()
    mock_pool.acquire = Mock(return_value=mock_conn)
    
    feature_flag_manager.db_pool = mock_pool
    
    result = await feature_flag_manager.get_all_features("123")
    
    assert isinstance(result, dict)
    assert "spell_check" in result
    assert "grammar_check" in result


def test_invalid_feature_name(feature_flag_manager):
    """Kiểm thử rằng tên feature không hợp lệ sẽ bị từ chối."""
    result = asyncio.run(
        feature_flag_manager.enable_feature("123", "invalid_feature")
    )
    
    assert result is False


def test_available_features_list():
    """Test that AVAILABLE_FEATURES contains expected features."""
    expected_features = [
        "spell_check",
        "grammar_check",
        "abstract_polish",
        "keyword_suggest",
        "synopsis_generation",
        "key_point_extraction",
        "reviewer_similarity",
        "email_draft_assist"
    ]
    
    for feature in expected_features:
        assert feature in AVAILABLE_FEATURES


