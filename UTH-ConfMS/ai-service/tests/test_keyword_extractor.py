"""
Bài kiểm thử đơn vị cho Trình trích xuất Từ khóa
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
from core.nlp.keyword_extractor import KeywordSuggester, Keyword


@pytest.fixture
def mock_model_manager():
    """Manager mô hình giả cho kiểm thử."""
    with patch('core.nlp.keyword_extractor.get_model_manager') as mock:
        manager = Mock()
        manager.call_llm = AsyncMock()
        mock.return_value = manager
        yield manager


@pytest.fixture
def keyword_suggester(mock_model_manager):
    """Tạo `KeywordSuggester` cho kiểm thử."""
    return KeywordSuggester()


@pytest.mark.asyncio
async def test_suggest_keywords_success(keyword_suggester, mock_model_manager):
    """Kiểm thử gợi ý từ khóa thành công."""
    mock_response = """[
        {
            "keyword": "machine learning",
            "score": 0.95,
            "reason": "Frequently mentioned in abstract",
            "category": "method"
        },
        {
            "keyword": "deep learning",
            "score": 0.85,
            "reason": "Related to main topic",
            "category": "technique"
        }
    ]"""
    mock_model_manager.call_llm.return_value = mock_response
    
    keywords = await keyword_suggester.suggest_keywords(
        title="Machine Learning Paper",
        abstract="This paper discusses machine learning and deep learning techniques.",
        language="en",
        max_keywords=5
    )
    
    assert len(keywords) == 2
    assert keywords[0].keyword == "machine learning"
    assert keywords[0].score == 0.95
    assert keywords[0].category == "method"
    # Should be sorted by score descending
    assert keywords[0].score >= keywords[1].score


@pytest.mark.asyncio
async def test_suggest_keywords_empty_input(keyword_suggester):
    """Kiểm thử gợi ý từ khóa với đầu vào rỗng."""
    with pytest.raises(ValueError, match="Title or abstract must be provided"):
        await keyword_suggester.suggest_keywords("", "", "en")


@pytest.mark.asyncio
async def test_suggest_keywords_title_too_long(keyword_suggester):
    """Kiểm thử gợi ý từ khóa khi tiêu đề quá dài."""
    long_title = "a" * 501
    with pytest.raises(ValueError, match="Title too long"):
        await keyword_suggester.suggest_keywords(long_title, "Abstract", "en")


@pytest.mark.asyncio
async def test_suggest_keywords_post_process(keyword_suggester, mock_model_manager):
    """Kiểm thử xử lý sau gợi ý từ khóa (loại trùng, điều chỉnh điểm)."""
    mock_response = """[
        {"keyword": "machine learning", "score": 0.8, "reason": "Test", "category": "method"},
        {"keyword": "Machine Learning", "score": 0.7, "reason": "Test", "category": "method"},
        {"keyword": "x", "score": 0.6, "reason": "Test", "category": "method"}
    ]"""
    mock_model_manager.call_llm.return_value = mock_response
    
    keywords = await keyword_suggester.suggest_keywords(
        title="Machine Learning Paper",
        abstract="This paper discusses machine learning.",
        language="en"
    )
    
    # Should remove duplicates (case-insensitive)
    assert len(keywords) == 2  # "machine learning" (duplicate removed), "x" (too short, removed)
    # "machine learning" should have boosted score because it appears in title
    assert keywords[0].keyword.lower() == "machine learning"


def test_post_process_keywords_remove_duplicates(keyword_suggester):
    """Kiểm thử loại bỏ trùng lặp trong xử lý sau."""
    keywords = [
        Keyword("test", 0.9, "reason", None),
        Keyword("Test", 0.8, "reason", None),  # Duplicate (case-insensitive)
        Keyword("other", 0.7, "reason", None)
    ]
    
    result = keyword_suggester._post_process_keywords(
        keywords, "Test title", "Test abstract"
    )
    
    # Should have 2 unique keywords
    assert len(result) == 2
    assert result[0].keyword.lower() == "test"
    assert result[1].keyword.lower() == "other"


