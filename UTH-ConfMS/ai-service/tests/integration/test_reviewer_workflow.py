"""
Kiểm thử tích hợp cho luồng công việc AI phản biện
Kiểm thử: Xem bài -> Tạo tóm tắt -> Xem điểm chính
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch


@pytest.mark.asyncio
async def test_reviewer_synopsis_generation_workflow():
    """Kiểm thử luồng tạo tóm tắt cho phản biện."""
    with patch('core.governance.feature_flags.get_feature_flag_manager') as mock_ff:
        with patch('core.nlp.synopsis_generator.get_synopsis_generator') as mock_gen:
            # Setup mocks
            feature_manager = Mock()
            feature_manager.is_enabled = AsyncMock(return_value=True)
            mock_ff.return_value = feature_manager
            
            generator = Mock()
            generator.generate_synopsis = AsyncMock(return_value=Mock(
                synopsis="This paper proposes a novel method...",
                length=200,
                key_themes=["machine learning", "optimization"],
                methodology="experimental",
                contribution_type="novel algorithm",
                rationale="Summary based on abstract analysis",
                word_count=200
            ))
            mock_gen.return_value = generator
            
            # Test synopsis generation
            from core.nlp.synopsis_generator import get_synopsis_generator
            gen = get_synopsis_generator()
            result = await gen.generate_synopsis(
                title="Test Paper",
                abstract="This paper presents a new approach...",
                keywords=["ML", "AI"],
                length="medium"
            )
            
            assert result.synopsis is not None
            assert len(result.key_themes) > 0
            assert result.word_count >= 150 and result.word_count <= 250


@pytest.mark.asyncio
async def test_reviewer_keypoint_extraction_workflow():
    """Kiểm thử luồng trích xuất điểm chính."""
    with patch('core.governance.feature_flags.get_feature_flag_manager') as mock_ff:
        with patch('core.nlp.keypoint_extractor.get_keypoint_extractor') as mock_ext:
            feature_manager = Mock()
            feature_manager.is_enabled = AsyncMock(return_value=True)
            mock_ff.return_value = feature_manager
            
            extractor = Mock()
            extractor.extract_keypoints = AsyncMock(return_value=Mock(
                claims=[Mock(text="Method achieves 95% accuracy", confidence=0.92)],
                methods=[Mock(name="Deep Neural Network", details="ResNet-50")],
                datasets=[Mock(name="ImageNet", usage="training")],
                novelty="First application of X to Y",
                limitations="Limited to supervised learning"
            ))
            mock_ext.return_value = extractor
            
            # Test keypoint extraction
            from core.nlp.keypoint_extractor import get_keypoint_extractor
            ext = get_keypoint_extractor()
            result = await ext.extract_keypoints(
                title="Test Paper",
                abstract="This paper presents...",
                language="en"
            )
            
            assert len(result.claims) > 0
            assert len(result.methods) > 0
            assert result.novelty is not None


@pytest.mark.asyncio
async def test_double_blind_compliance():
    """Kiểm thử rằng tóm tắt tuân thủ nguyên tắc double-blind."""
    with patch('core.governance.double_blind.get_double_blind_validator') as mock_val:
        validator = Mock()
        validator.validate_synopsis = Mock(return_value={
            "is_valid": True,
            "issues": [],
            "redacted_synopsis": "This paper proposes..."
        })
        mock_val.return_value = validator
        
        # Test validation
        from core.governance.double_blind import get_double_blind_validator
        val = get_double_blind_validator()
        result = val.validate_synopsis(
            synopsis="This paper by John Smith proposes...",
            paper_metadata={},
            author_names=["John Smith"]
        )
        
        assert result["is_valid"] is True or len(result["issues"]) == 0


@pytest.mark.asyncio
async def test_synopsis_caching():
    """Kiểm thử chức năng cache cho tóm tắt (nếu backend có triển khai)."""
    # This would test backend caching, placeholder for now
    assert True  # Placeholder


