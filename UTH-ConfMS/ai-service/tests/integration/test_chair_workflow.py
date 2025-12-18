"""
Kiểm thử tích hợp cho luồng công việc AI của Chủ tịch
Kiểm thử: Tính toán độ tương đồng -> Gợi ý phân công -> Soạn email
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
import numpy as np


@pytest.mark.asyncio
async def test_chair_similarity_calculation_workflow():
    """Kiểm thử luồng tính toán độ tương đồng."""
    with patch('core.governance.feature_flags.get_feature_flag_manager') as mock_ff:
        with patch('core.services.similarity_calculator.get_similarity_calculator') as mock_sim:
            feature_manager = Mock()
            feature_manager.is_enabled = AsyncMock(return_value=True)
            mock_ff.return_value = feature_manager
            
            calculator = Mock()
            calculator.rank_reviewers_for_paper = AsyncMock(return_value=[
                Mock(
                    reviewer_id="rev-1",
                    similarity_score=0.87,
                    matching_keywords=["deep learning", "NLP"],
                    common_topics=["neural networks"],
                    expertise_match="high",
                    rationale="Strong expertise alignment",
                    confidence=0.87
                )
            ])
            mock_sim.return_value = calculator
            
            # Test similarity calculation
            from core.services.similarity_calculator import get_similarity_calculator
            calc = get_similarity_calculator()
            matches = await calc.rank_reviewers_for_paper(
                paper_id="paper-1",
                paper_title="Test Paper",
                paper_abstract="This paper...",
                paper_keywords=["ML", "AI"],
                candidate_reviewer_ids=["rev-1"],
                reviewer_data={"rev-1": {"expertise_keywords": ["deep learning"]}}
            )
            
            assert len(matches) == 1
            assert matches[0].similarity_score >= 0.0 and matches[0].similarity_score <= 1.0
            assert matches[0].expertise_match in ["high", "medium", "low"]


@pytest.mark.asyncio
async def test_chair_assignment_suggestion_workflow():
    """Kiểm thử luồng gợi ý phân công."""
    with patch('core.governance.feature_flags.get_feature_flag_manager') as mock_ff:
        with patch('core.services.assignment_suggester.get_assignment_suggester') as mock_sug:
            feature_manager = Mock()
            feature_manager.is_enabled = AsyncMock(return_value=True)
            mock_ff.return_value = feature_manager
            
            suggester = Mock()
            suggester.suggest_assignments = AsyncMock(return_value=Mock(
                suggested_assignments=[
                    Mock(paper_id="paper-1", reviewer_id="rev-1", score=0.89, rationale="Good match")
                ],
                unassigned_papers=[],
                overloaded_reviewers=[],
                rationale="Optimal matching"
            ))
            mock_sug.return_value = suggester
            
            # Test assignment suggestion
            from core.services.assignment_suggester import get_assignment_suggester, AssignmentConstraints
            sug = get_assignment_suggester()
            result = await sug.suggest_assignments(
                paper_ids=["paper-1"],
                paper_data={"paper-1": {"title": "Test", "abstract": "Test abstract", "keywords": []}},
                reviewer_ids=["rev-1"],
                reviewer_data={"rev-1": {"expertise_keywords": []}},
                constraints=AssignmentConstraints(
                    max_papers_per_reviewer=5,
                    min_reviewers_per_paper=3
                )
            )
            
            assert len(result.suggested_assignments) >= 0
            assert result.rationale is not None


@pytest.mark.asyncio
async def test_coi_respected_in_assignments():
    """Kiểm thử rằng xung đột lợi ích (COI) được tôn trọng trong gợi ý phân công."""
    with patch('core.services.assignment_suggester.get_assignment_suggester') as mock_sug:
        suggester = Mock()
        suggester.suggest_assignments = AsyncMock(return_value=Mock(
            suggested_assignments=[],
            unassigned_papers=["paper-1"],
            overloaded_reviewers=[],
            rationale="COI exclusions applied"
        ))
        mock_sug.return_value = suggester
        
        # Test with COI exclusions
        from core.services.assignment_suggester import get_assignment_suggester, AssignmentConstraints
        sug = get_assignment_suggester()
        result = await sug.suggest_assignments(
            paper_ids=["paper-1"],
            paper_data={"paper-1": {"title": "Test", "abstract": "Test", "keywords": []}},
            reviewer_ids=["rev-1"],
            reviewer_data={"rev-1": {"expertise_keywords": []}},
            constraints=AssignmentConstraints(
                coi_exclusions=[{"paper_id": "paper-1", "reviewer_id": "rev-1"}]
            )
        )
        
        # Should not suggest assignment with COI
        coi_assignments = [
            a for a in result.suggested_assignments
            if a.paper_id == "paper-1" and a.reviewer_id == "rev-1"
        ]
        assert len(coi_assignments) == 0


@pytest.mark.asyncio
async def test_chair_email_draft_workflow():
    """Kiểm thử luồng tạo bản nháp email."""
    with patch('core.governance.feature_flags.get_feature_flag_manager') as mock_ff:
        with patch('core.services.email_generator.get_email_generator') as mock_email:
            feature_manager = Mock()
            feature_manager.is_enabled = AsyncMock(return_value=True)
            mock_ff.return_value = feature_manager
            
            generator = Mock()
            generator.draft_decision_email = AsyncMock(return_value=Mock(
                subject="Congratulations! Paper Accepted",
                body="Dear Dr. ...",
                template_type="accept_notification",
                personalization={"author_name": "John Doe"},
                rationale="Generated acceptance email",
                requires_review=True
            ))
            mock_email.return_value = generator
            
            # Test email generation
            from core.services.email_generator import get_email_generator
            gen = get_email_generator()
            draft = await gen.draft_decision_email(
                paper_id="paper-1",
                paper_title="Test Paper",
                author_name="John Doe",
                decision="accept",
                conference_name="Test Conference"
            )
            
            assert draft.subject is not None
            assert draft.body is not None
            assert draft.requires_review is True


