"""
Các kiểm thử đơn vị cho Language Checker (Kiểm tra chính tả và ngữ pháp)
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
from core.nlp.language_checker import SpellChecker, GrammarChecker, SpellingError, GrammarError


@pytest.fixture
def mock_model_manager():
    """Manager mô hình giả cho kiểm thử."""
    with patch('core.nlp.language_checker.get_model_manager') as mock:
        manager = Mock()
        manager.call_llm = AsyncMock()
        mock.return_value = manager
        yield manager


@pytest.fixture
def spell_checker(mock_model_manager):
    """Tạo `SpellChecker` cho kiểm thử."""
    return SpellChecker()


@pytest.fixture
def grammar_checker(mock_model_manager):
    """Tạo `GrammarChecker` cho kiểm thử."""
    return GrammarChecker()


@pytest.mark.asyncio
async def test_spell_check_success(spell_checker, mock_model_manager):
    """Kiểm thử kiểm tra chính tả thành công."""
    # Mock LLM response
    mock_response = """[
        {
            "word": "recieve",
            "position": 10,
            "suggestions": ["receive"],
            "context": "I recieve the message"
        }
    ]"""
    mock_model_manager.call_llm.return_value = mock_response
    
    errors = await spell_checker.check_spelling("I recieve the message", "en")
    
    assert len(errors) == 1
    assert errors[0].word == "recieve"
    assert "receive" in errors[0].suggestions
    mock_model_manager.call_llm.assert_called_once()


@pytest.mark.asyncio
async def test_spell_check_empty_text(spell_checker):
    """Kiểm thử kiểm tra chính tả với văn bản rỗng."""
    errors = await spell_checker.check_spelling("", "en")
    assert len(errors) == 0


@pytest.mark.asyncio
async def test_spell_check_too_long(spell_checker):
    """Kiểm thử kiểm tra chính tả với văn bản quá dài."""
    long_text = "a" * 10001
    with pytest.raises(ValueError, match="Text too long"):
        await spell_checker.check_spelling(long_text, "en")


@pytest.mark.asyncio
async def test_grammar_check_success(grammar_checker, mock_model_manager):
    """Kiểm thử kiểm tra ngữ pháp thành công."""
    # Mock LLM response
    mock_response = """[
        {
            "error_type": "subject-verb agreement",
            "position": 5,
            "original": "they was",
            "suggestion": "they were",
            "explanation": "Subject-verb agreement error",
            "context": "They was happy"
        }
    ]"""
    mock_model_manager.call_llm.return_value = mock_response
    
    errors = await grammar_checker.check_grammar("They was happy", "en")
    
    assert len(errors) == 1
    assert errors[0].error_type == "subject-verb agreement"
    assert errors[0].original == "they was"
    assert errors[0].suggestion == "they were"
    mock_model_manager.call_llm.assert_called_once()


@pytest.mark.asyncio
async def test_grammar_check_vietnamese(grammar_checker, mock_model_manager):
    """Kiểm thử kiểm tra ngữ pháp cho tiếng Việt."""
    mock_response = """[
        {
            "error_type": "ngữ pháp",
            "position": 10,
            "original": "tôi đã đi",
            "suggestion": "tôi đã đến",
            "explanation": "Sử dụng sai động từ",
            "context": "Tôi đã đi đó"
        }
    ]"""
    mock_model_manager.call_llm.return_value = mock_response
    
    errors = await grammar_checker.check_grammar("Tôi đã đi đó", "vi")
    
    assert len(errors) == 1
    assert errors[0].error_type == "ngữ pháp"


def test_parse_spell_check_response_with_markdown(spell_checker):
    """Kiểm thử phân tích phản hồi kiểm tra chính tả có khối mã markdown."""
    response = """```json
    [
        {"word": "test", "position": 0, "suggestions": ["tested"]}
    ]
    ```"""
    
    errors = spell_checker._parse_spell_check_response(response, "test text")
    assert len(errors) == 1
    assert errors[0].word == "test"


def test_parse_spell_check_response_invalid_json(spell_checker):
    """Kiểm thử phân tích phản hồi JSON không hợp lệ."""
    response = "Invalid JSON response"
    errors = spell_checker._parse_spell_check_response(response, "test text")
    assert len(errors) == 0


