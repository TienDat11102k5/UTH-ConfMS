"""
Bài kiểm thử đơn vị cho Abstract Enhancer
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
from core.nlp.abstract_enhancer import AbstractPolisher, PolishResult, Change


@pytest.fixture
def mock_model_manager():
    """Manager mô hình giả cho kiểm thử."""
    with patch('core.nlp.abstract_enhancer.get_model_manager') as mock:
        manager = Mock()
        manager.call_llm = AsyncMock()
        mock.return_value = manager
        yield manager


@pytest.fixture
def abstract_polisher(mock_model_manager):
    """Tạo `AbstractPolisher` cho kiểm thử."""
    return AbstractPolisher()


@pytest.mark.asyncio
async def test_polish_abstract_success(abstract_polisher, mock_model_manager):
    """Kiểm thử đánh bóng tóm tắt thành công."""
    original = "This is a test abstract."
    mock_response = """{
        "polished": "This is an improved test abstract.",
        "changes": [
            {
                "change_type": "clarity",
                "before": "a test",
                "after": "an improved test",
                "position": 10,
                "explanation": "Improved clarity"
            }
        ],
        "rationale": "Enhanced clarity and academic tone",
        "confidence_score": 0.85
    }"""
    mock_model_manager.call_llm.return_value = mock_response
    
    result = await abstract_polisher.polish_abstract(original, "en")
    
    assert result.original == original
    assert result.polished == "This is an improved test abstract."
    assert len(result.changes) == 1
    assert result.changes[0].change_type == "clarity"
    assert result.rationale == "Enhanced clarity and academic tone"
    assert result.confidence_score == 0.85


@pytest.mark.asyncio
async def test_polish_abstract_empty(abstract_polisher):
    """Kiểm thử đánh bóng khi tóm tắt rỗng."""
    with pytest.raises(ValueError, match="Abstract text cannot be empty"):
        await abstract_polisher.polish_abstract("", "en")


@pytest.mark.asyncio
async def test_polish_abstract_too_long(abstract_polisher):
    """Kiểm thử đánh bóng khi tóm tắt quá dài."""
    long_abstract = "a" * 2001
    with pytest.raises(ValueError, match="Abstract too long"):
        await abstract_polisher.polish_abstract(long_abstract, "en")


@pytest.mark.asyncio
async def test_polish_abstract_preserve_meaning(abstract_polisher, mock_model_manager):
    """Kiểm thử đánh bóng khi bật cờ `preserve_meaning`."""
    mock_response = """{
        "polished": "Improved version",
        "changes": [],
        "rationale": "Preserved meaning",
        "confidence_score": 0.9
    }"""
    mock_model_manager.call_llm.return_value = mock_response
    
    result = await abstract_polisher.polish_abstract(
        "Original text",
        "en",
        preserve_meaning=True,
        enhance_tone=False
    )
    
    assert result.polished == "Improved version"
    mock_model_manager.call_llm.assert_called_once()


@pytest.mark.asyncio
async def test_polish_abstract_parse_failure(abstract_polisher, mock_model_manager):
    """Kiểm thử xử lý khi phân tích (parse) phản hồi thất bại."""
    mock_model_manager.call_llm.return_value = "Invalid JSON"
    
    result = await abstract_polisher.polish_abstract("Test abstract", "en")
    
    # Should return fallback result
    assert result.original == "Test abstract"
    assert result.polished == "Test abstract"  # Fallback to original
    assert len(result.changes) == 0
    assert result.confidence_score == 0.0


