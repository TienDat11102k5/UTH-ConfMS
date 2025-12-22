package edu.uth.backend.assignment;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.uth.backend.ai.AIProxyService;
import edu.uth.backend.ai.dto.AssignmentSuggestionRequest;
import edu.uth.backend.ai.dto.AssignmentSuggestionResponse;
import edu.uth.backend.ai.dto.ReviewerSimilarityRequest;
import edu.uth.backend.ai.dto.ReviewerSimilarityResponse;
import edu.uth.backend.entity.ConflictOfInterest;
import edu.uth.backend.repository.ConflictOfInterestRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class AIAssignmentService {

    private static final Logger logger = LoggerFactory.getLogger(AIAssignmentService.class);

    private final AIProxyService aiProxyService;
    private final ConflictOfInterestRepository coiRepository;
    private final ObjectMapper objectMapper;

    // ✅ Constructor injection – KHÔNG cần @Autowired
    public AIAssignmentService(
            AIProxyService aiProxyService,
            ConflictOfInterestRepository coiRepository,
            ObjectMapper objectMapper
    ) {
        this.aiProxyService = aiProxyService;
        this.coiRepository = coiRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Tính điểm tương đồng giữa bài báo và reviewer
     */
    public Map<String, Object> getSimilarityScores(
            Long paperId,
            String paperTitle,
            String paperAbstract,
            List<String> paperKeywords,
            List<Long> reviewerIds,
            Map<Long, Map<String, Object>> reviewerData,
            Long conferenceId
    ) {
        try {
            ReviewerSimilarityRequest request = new ReviewerSimilarityRequest();
            request.setPaperTitle(paperTitle);
            request.setPaperKeywords(
                    paperKeywords != null ? String.join(", ", paperKeywords) : ""
            );
            request.setConferenceId(conferenceId);

            List<ReviewerSimilarityRequest.ReviewerInfo> reviewerInfos = new ArrayList<>();
            for (Long reviewerId : reviewerIds) {
                Map<String, Object> data =
                        reviewerData.getOrDefault(reviewerId, Collections.emptyMap());

                ReviewerSimilarityRequest.ReviewerInfo info =
                        new ReviewerSimilarityRequest.ReviewerInfo();

                info.setId(reviewerId.toString());
                info.setName((String) data.getOrDefault("name", "Unknown"));

                Object expertise = data.get("expertise");
                info.setExpertise(expertise != null ? expertise.toString() : "");

                reviewerInfos.add(info);
            }
            request.setReviewers(reviewerInfos);

            ReviewerSimilarityResponse response =
                    aiProxyService.calculateReviewerSimilarity(
                            request, null, conferenceId
                    );

            logger.info(
                    "Đã tính điểm tương đồng cho bài {} với {} reviewer",
                    paperId,
                    reviewerIds.size()
            );

            Map<String, Object> result = new HashMap<>();
            result.put("scores", response.getSimilarityScores());
            result.put("reasoning", response.getReasoning());

            return result;

        } catch (Exception e) {
            logger.error("Lỗi khi tính điểm tương đồng", e);
            throw new RuntimeException(
                    "Tính điểm tương đồng thất bại: " + e.getMessage(), e
            );
        }
    }

    /**
     * Gợi ý phân công reviewer cho bài báo
     */
    public Map<String, Object> getSuggestedAssignments(
            Long conferenceId,
            List<Long> paperIds,
            Map<Long, Map<String, Object>> paperData,
            List<Long> reviewerIds,
            Map<Long, Map<String, Object>> reviewerData,
            int maxPapersPerReviewer,
            int minReviewersPerPaper
    ) {
        try {
            // Lấy danh sách COI
            List<Map<String, String>> coiExclusions = new ArrayList<>();
            for (Long paperId : paperIds) {
                List<ConflictOfInterest> cois =
                        coiRepository.findByPaperId(paperId);

                for (ConflictOfInterest coi : cois) {
                    Map<String, String> exclusion = new HashMap<>();
                    exclusion.put("paper_id", paperId.toString());
                    exclusion.put(
                            "reviewer_id",
                            coi.getReviewer().getId().toString()
                    );
                    coiExclusions.add(exclusion);
                }
            }

            AssignmentSuggestionRequest request =
                    new AssignmentSuggestionRequest();

            request.setPaperIds(
                    paperIds.stream().map(String::valueOf).toList()
            );
            request.setReviewerIds(
                    reviewerIds.stream().map(String::valueOf).toList()
            );
            request.setConferenceId(conferenceId);

            // Metadata JSON
            request.setPapersMetadata(
                    objectMapper.writeValueAsString(paperData)
            );
            request.setReviewersMetadata(
                    objectMapper.writeValueAsString(reviewerData)
            );

            Map<String, Object> constraints = new HashMap<>();
            constraints.put(
                    "max_papers_per_reviewer",
                    maxPapersPerReviewer
            );
            constraints.put(
                    "min_reviewers_per_paper",
                    minReviewersPerPaper
            );
            constraints.put("coi_exclusions", coiExclusions);
            constraints.put("workload_balance", true);

            request.setConstraints(
                    objectMapper.writeValueAsString(constraints)
            );

            AssignmentSuggestionResponse response =
                    aiProxyService.suggestAssignments(
                            request, null, conferenceId
                    );

            logger.info(
                    "Đã nhận {} đề xuất phân công",
                    response.getAssignments().size()
            );

            Map<String, Object> result = new HashMap<>();
            result.put(
                    "suggested_assignments",
                    response.getAssignments()
            );
            return result;

        } catch (Exception e) {
            logger.error("Lỗi khi gợi ý phân công reviewer", e);
            throw new RuntimeException(
                    "Lấy đề xuất phân công thất bại: " + e.getMessage(), e
            );
        }
    }

    /**
     * Kiểm tra xung đột lợi ích (COI)
     */
    public boolean validateAssignmentAgainstCOI(
            Long paperId,
            Long reviewerId
    ) {
        boolean hasCOI =
                coiRepository.existsByPaperIdAndReviewerId(
                        paperId, reviewerId
                );

        if (hasCOI) {
            logger.warn(
                    "Phát hiện COI: Paper {} - Reviewer {}",
                    paperId,
                    reviewerId
            );
        }
        return !hasCOI;
    }
}
