"""
Bài kiểm thử đơn vị cho Model Manager
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
from core.governance.model_manager import ModelManager, AIProvider


@pytest.fixture
def mock_settings():
    """Cài đặt giả cho việc kiểm thử."""
    with patch('core.governance.model_manager.get_settings') as mock:
        settings = Mock()
        settings.ai_provider = "openai"
        settings.model_name = "gpt-4o-mini"
        settings.max_tokens = 2000
        settings.temperature = 0.3
        settings.openai_api_key = "test-key"
        mock.return_value = settings
        yield settings


@pytest.fixture
def model_manager(mock_settings):
    """Tạo một instance `ModelManager` cho kiểm thử."""
    with patch('openai.AsyncOpenAI') as mock_openai:
        mock_client = Mock()
        mock_openai.return_value = mock_client
        manager = ModelManager()
        manager.openai_client = mock_client
        return manager


@pytest.mark.asyncio
async def test_call_openai(model_manager):
    """Kiểm thử gọi API OpenAI."""
    # Mock OpenAI response
    mock_response = Mock()
    mock_choice = Mock()
    mock_choice.message.content = "Test response"
    mock_response.choices = [mock_choice]
    
    model_manager.openai_client.chat.completions.create = AsyncMock(
        return_value=mock_response
    )
    
    result = await model_manager._call_openai(
        prompt="Test prompt",
        system_instruction="You are helpful",
        model="gpt-4o-mini",
        max_tokens=2000,
        temperature=0.3
    )
    
    assert result == "Test response"
    model_manager.openai_client.chat.completions.create.assert_called_once()


@pytest.mark.asyncio
async def test_call_llm_with_rate_limit(model_manager):
    """Kiểm thử gọi LLM với giới hạn tốc độ (rate limiting)."""
    # Mock OpenAI response
    mock_response = Mock()
    mock_choice = Mock()
    mock_choice.message.content = "Test response"
    mock_response.choices = [mock_choice]
    
    model_manager.openai_client.chat.completions.create = AsyncMock(
        return_value=mock_response
    )
    
    # First call should succeed
    result = await model_manager.call_llm(
        prompt="Test prompt",
        system_instruction="You are helpful",
        conference_id="conf-123",
        check_rate_limit=True
    )
    
    assert result == "Test response"
    
    # Set rate limit to exceeded
    model_manager.rate_limits["conf-123"] = {
        "count": 100,
        "reset_time": 9999999999  # Far future
    }
    
    # Next call should fail due to rate limit
    with pytest.raises(Exception, match="Rate limit exceeded"):
        await model_manager.call_llm(
            prompt="Test prompt",
            conference_id="conf-123",
            check_rate_limit=True
        )


@pytest.mark.asyncio
async def test_call_llm_without_rate_limit(model_manager):
    """Kiểm thử gọi LLM khi không áp dụng giới hạn tốc độ."""
    # Mock OpenAI response
    mock_response = Mock()
    mock_choice = Mock()
    mock_choice.message.content = "Test response"
    mock_response.choices = [mock_choice]
    
    model_manager.openai_client.chat.completions.create = AsyncMock(
        return_value=mock_response
    )
    
    result = await model_manager.call_llm(
        prompt="Test prompt",
        check_rate_limit=False
    )
    
    assert result == "Test response"


def test_check_rate_limit(model_manager):
    """Kiểm thử hàm kiểm tra giới hạn tốc độ."""
    conference_id = "conf-123"
    
    # First call should pass
    assert model_manager._check_rate_limit(conference_id, max_calls=100) is True
    
    # Set count to max
    model_manager.rate_limits[conference_id] = {
        "count": 100,
        "reset_time": 9999999999
    }
    
    # Next call should fail
    assert model_manager._check_rate_limit(conference_id, max_calls=100) is False


def test_get_provider_info(model_manager):
    """Kiểm thử lấy thông tin nhà cung cấp (provider)."""
    info = model_manager.get_provider_info()
    
    assert "provider" in info
    assert "model" in info
    assert "max_tokens" in info
    assert "openai_configured" in info


@pytest.mark.asyncio
async def test_retry_logic(model_manager):
    """Kiểm thử logic thử lại với backoff lũy thừa."""
    # Mock OpenAI to fail twice then succeed
    call_count = 0
    
    async def mock_create(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count < 3:
            raise Exception("Temporary error")
        mock_response = Mock()
        mock_choice = Mock()
        mock_choice.message.content = "Success after retry"
        mock_response.choices = [mock_choice]
        return mock_response
    
    model_manager.openai_client.chat.completions.create = mock_create
    
    result = await model_manager._call_openai(
        prompt="Test prompt",
        system_instruction="You are helpful",
        model="gpt-4o-mini",
        max_tokens=2000,
        temperature=0.3
    )
    
    assert result == "Success after retry"
    assert call_count == 3


