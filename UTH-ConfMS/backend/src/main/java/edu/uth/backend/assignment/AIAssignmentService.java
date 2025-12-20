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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class AIAssignmentService {

    private static final Logger logger = LoggerFactory.getLogger(AIAssignmentService.class);

    private final AIProxyService aiProxyService;
    private final ConflictOfInterestRepository coiRepository;
    private final ObjectMapper objectMapper;

    @Autowired
    public AIAssignmentService(AIProxyService aiProxyService,
            ConflictOfInterestRepository coiRepository,
            ObjectMapper objectMapper) {
        this.aiProxyService = aiProxyService;
        this.coiRepository = coiRepository;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> getSimilarityScores(
            Long paperId,
            String paperTitle,
            String paperAbstract,
            List<String> paperKeywords,
            List<Long> reviewerIds,
            Map<Long, Map<String, Object>> reviewerData,
            Long conferenceId) {
        try {
            ReviewerSimilarityRequest request = new ReviewerSimilarityRequest();
            request.setPaperTitle(paperTitle);
            request.setPaperKeywords(paperKeywords != null ? String.join(", ", paperKeywords) : "");
            request.setConferenceId(conferenceId);

            List<ReviewerSimilarityRequest.ReviewerInfo> reviewerInfos = new ArrayList<>();
            for (Long rId : reviewerIds) {
                Map<String, Object> data = reviewerData.getOrDefault(rId, Collections.emptyMap());
                ReviewerSimilarityRequest.ReviewerInfo info = new ReviewerSimilarityRequest.ReviewerInfo();
                info.setId(rId.toString());
                info.setName((String) data.getOrDefault("name", "Unknown"));
                Object expertise = data.get("expertise"); // keyword list or string
                info.setExpertise(expertise != null ? expertise.toString() : "");
                reviewerInfos.add(info);
            }
            request.setReviewers(reviewerInfos);

            // Sử dụng null cho userId vì đây thường là quy trình nền hoặc quy trình hệ
            // thống
            ReviewerSimilarityResponse response = aiProxyService.calculateReviewerSimilarity(request, null,
                    conferenceId);

            logger.info("Đã tính điểm tương đồng cho bài {} với {} reviewer", paperId, reviewerIds.size());

            // Chuyển đổi DTO trở lại Map<String, Object> để tương thích ngược hoặc linh
            // hoạt
            Map<String, Object> result = new HashMap<>();
            // Có cần làm phẳng điểm số và lý do? Hay trả về có cấu trúc?
            // Các trình gọi hiện tại có thể mong đợi Map<ReviewerID, IntegerScore> hoặc
            // Map<ReviewerID, Object>
            // Giả sử họ muốn bản đồ điểm cộng với lý do riêng biệt hoặc kết hợp.
            // Nếu AI gốc trả về "Map<String, Object>", có thể nó chỉ trả về đối tượng JSON
            // từ AI.
            // DTO của tôi tách nó ra.
            // Hãy trả về một bản đồ chứa cả hai.
            result.put("scores", response.getSimilarityScores());
            result.put("reasoning", response.getReasoning());
            // Also merge scores at top level if previous code expected that (likely not if
            // it was raw AI response).
            // Actually, `response` in previous code was `Map<String, Object>`.
            // Let's return the whole thing.
            return result;

        } catch (Exception e) {
            logger.error("Lỗi khi lấy điểm tương đồng", e);
            throw new RuntimeException("Tính điểm tương đồng thất bại: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> getSuggestedAssignments(
            Long conferenceId,
            List<Long> paperIds,
            Map<Long, Map<String, Object>> paperData,
            List<Long> reviewerIds,
            Map<Long, Map<String, Object>> reviewerData,
            int maxPapersPerReviewer,
            int minReviewersPerPaper) {
        try {
            // Lấy các ngoại lệ COI
            List<Map<String, String>> coiExclusions = new ArrayList<>();
            for (Long paperId : paperIds) {
                List<ConflictOfInterest> cois = coiRepository.findByPaperId(paperId);
                for (ConflictOfInterest coi : cois) {
                    Map<String, String> exclusion = new HashMap<>();
                    exclusion.put("paper_id", paperId.toString());
                    exclusion.put("reviewer_id", coi.getReviewer().getId().toString());
                    coiExclusions.add(exclusion);
                }
            }

            AssignmentSuggestionRequest request = new AssignmentSuggestionRequest();
            request.setPaperIds(paperIds.stream().map(String::valueOf).toList());
            request.setReviewerIds(reviewerIds.stream().map(String::valueOf).toList());
            request.setConferenceId(conferenceId);

            // Serialize metadata thành chuỗi JSON
            request.setPapersMetadata(objectMapper.writeValueAsString(paperData));
            request.setReviewersMetadata(objectMapper.writeValueAsString(reviewerData));

            Map<String, Object> constraintsMap = new HashMap<>();
            constraintsMap.put("max_papers_per_reviewer", maxPapersPerReviewer);
            constraintsMap.put("min_reviewers_per_paper", minReviewersPerPaper);
            constraintsMap.put("coi_exclusions", coiExclusions);
            constraintsMap.put("workload_balance", true);
            request.setConstraints(objectMapper.writeValueAsString(constraintsMap));

            AssignmentSuggestionResponse response = aiProxyService.suggestAssignments(request, null, conferenceId);

            logger.info("Đã nhận đề xuất phân công: {} assignments", response.getAssignments().size());

            // Chuyển đổi sang Map<String, Object>
            Map<String, Object> result = new HashMap<>();
            result.put("suggested_assignments", response.getAssignments());
            return result;

        } catch (Exception e) {
            logger.error("Lỗi khi lấy đề xuất phân công", e);
            throw new RuntimeException("Lấy đề xuất phân công thất bại: " + e.getMessage(), e);
        }
    }

    public boolean validateAssignmentAgainstCOI(Long paperId, Long reviewerId) {
        boolean hasCOI = coiRepository.existsByPaperIdAndReviewerId(paperId, reviewerId);
        if (hasCOI) {
            logger.warn("Phát hiện xung đột lợi ích (COI): Bài {} và Reviewer {}", paperId, reviewerId);
        }
        return !hasCOI;
    }
}
