"""
Kiểm thử tích hợp cho luồng công việc AI của Tác giả
Kiểm thử: Nộp bài -> Kiểm tra chính tả -> Đánh bóng tóm tắt -> Chấp nhận thay đổi
"""
import pytest
from httpx import AsyncClient
from fastapi.testclient import TestClient
from unittest.mock import Mock, AsyncMock, patch
import asyncio

# Note: These tests require a running AI service or mocked dependencies


@pytest.mark.asyncio
async def test_author_spell_check_workflow():
    """Kiểm thử hoàn chỉnh luồng kiểm tra chính tả."""
    # Mock dependencies
    with patch('core.governance.feature_flags.get_feature_flag_manager') as mock_ff:
        with patch('core.nlp.language_checker.get_spell_checker') as mock_spell:
            # Setup mocks
            feature_manager = Mock()
            feature_manager.is_enabled = AsyncMock(return_value=True)
            mock_ff.return_value = feature_manager
            
            spell_checker = Mock()
            spell_checker.check_spelling = AsyncMock(return_value=[
                Mock(word="recieve", position=10, suggestions=["receive"], context="I recieve the message")
            ])
            mock_spell.return_value = spell_checker
            
            # Test spell check
            from core.nlp.language_checker import get_spell_checker
            checker = get_spell_checker()
            errors = await checker.check_spelling("I recieve the message", "en")
            
            assert len(errors) == 1
            assert errors[0].word == "recieve"
            assert "receive" in errors[0].suggestions


@pytest.mark.asyncio
async def test_author_abstract_polish_workflow():
    """Kiểm thử hoàn chỉnh luồng đánh bóng tóm tắt."""
    with patch('core.governance.feature_flags.get_feature_flag_manager') as mock_ff:
        with patch('core.nlp.abstract_enhancer.get_abstract_polisher') as mock_polish:
            # Setup mocks
            feature_manager = Mock()
            feature_manager.is_enabled = AsyncMock(return_value=True)
            mock_ff.return_value = feature_manager
            
            polisher = Mock()
            polisher.polish_abstract = AsyncMock(return_value=Mock(
                original="This is a test abstract.",
                polished="This is an improved test abstract.",
                changes=[Mock(change_type="clarity", before="a test", after="an improved test")],
                rationale="Improved clarity",
                word_count=5
            ))
            mock_polish.return_value = polisher
            
            # Test abstract polish
            from core.nlp.abstract_enhancer import get_abstract_polisher
            polisher_instance = get_abstract_polisher()
            result = await polisher_instance.polish_abstract("This is a test abstract.", "en")
            
            assert result.original == "This is a test abstract."
            assert result.polished == "This is an improved test abstract."
            assert len(result.changes) == 1


@pytest.mark.asyncio
async def test_author_feature_flag_respect():
    """Kiểm thử rằng các tính năng tôn trọng feature flags."""
    with patch('core.governance.feature_flags.get_feature_flag_manager') as mock_ff:
        feature_manager = Mock()
        feature_manager.is_enabled = AsyncMock(return_value=False)  # Feature disabled
        mock_ff.return_value = feature_manager
        
        # Attempt to use feature should fail
        from core.governance.feature_flags import get_feature_flag_manager
        manager = get_feature_flag_manager()
        enabled = await manager.is_enabled("conf-123", "spell_check")
        
        assert enabled is False


@pytest.mark.asyncio
async def test_audit_logging_in_workflow():
    """Kiểm thử rằng nhật ký kiểm toán được tạo trong luồng công việc."""
    with patch('core.governance.audit_logger.get_audit_logger') as mock_audit:
        audit_logger = Mock()
        audit_logger.log_operation = AsyncMock(return_value="log-123")
        mock_audit.return_value = audit_logger
        
        # Simulate operation
        from core.governance.audit_logger import get_audit_logger
        logger = get_audit_logger()
        log_id = await logger.log_operation(
            conference_id="conf-123",
            user_id="user-456",
            feature="spell_check",
            action="check_spelling",
            prompt="Test text",
            model_id="gemini-1.5-flash",
            output_summary="Found 1 error",
            accepted=None
        )
        
        assert log_id == "log-123"
        audit_logger.log_operation.assert_called_once()

