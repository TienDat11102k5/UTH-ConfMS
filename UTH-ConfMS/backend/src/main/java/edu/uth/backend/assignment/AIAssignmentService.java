package edu.uth.backend.assignment;

import edu.uth.backend.ai.AIProxyService;
import edu.uth.backend.entity.ConflictOfInterest;
import edu.uth.backend.repository.ConflictOfInterestRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Dịch vụ Phân Công AI
 * Xử lý tính toán điểm tương đồng giữa reviewer và bài báo bằng AI và gợi ý phân công.
 */
@Service
public class AIAssignmentService {

    private static final Logger logger = LoggerFactory.getLogger(AIAssignmentService.class);
    
    @Autowired
    private AIProxyService aiProxyService;
    
    @Autowired
    private ConflictOfInterestRepository coiRepository;

    /**
     * Lấy điểm tương đồng giữa một bài và nhiều reviewer.
     *
     * @param paperId ID bài
     * @param paperTitle Tiêu đề bài
     * @param paperAbstract Tóm tắt bài
     * @param paperKeywords Từ khóa bài
     * @param reviewerIds Danh sách ID reviewer
     * @param reviewerData Dữ liệu reviewer (từ khóa chuyên môn, tóm tắt trước đây)
     * @param conferenceId ID hội nghị
     * @return Bản đồ reviewer_id -> điểm_tương_đồng
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
            // Convert reviewer data format
            Map<String, Map<String, Object>> reviewerDataStr = new HashMap<>();
            for (Map.Entry<Long, Map<String, Object>> entry : reviewerData.entrySet()) {
                reviewerDataStr.put(entry.getKey().toString(), entry.getValue());
            }
            
            // Prepare request
            Map<String, Object> request = new HashMap<>();
            request.put("paper_id", paperId.toString());
            request.put("paper_title", paperTitle);
            request.put("paper_abstract", paperAbstract);
            request.put("paper_keywords", paperKeywords);
            request.put("reviewer_ids", reviewerIds.stream().map(String::valueOf).toList());
            request.put("reviewer_data", reviewerDataStr);
            request.put("conference_id", conferenceId.toString());
            
            // Call AI service
            @SuppressWarnings("unchecked")
            Map<String, Object> response = (Map<String, Object>) aiProxyService.callAIService(
                    "/api/v1/assignment/calculate-similarity",
                    request,
                    Map.class
            );
            
                logger.info("Đã tính điểm tương đồng cho bài {} với {} reviewer", 
                    paperId, reviewerIds.size());
            
            return response;
            
        } catch (Exception e) {
            logger.error("Lỗi khi lấy điểm tương đồng", e);
            throw new RuntimeException("Tính điểm tương đồng thất bại: " + e.getMessage(), e);
        }
    }

    /**
     * Lấy gợi ý phân công với các ràng buộc.
     *
     * @param conferenceId ID hội nghị
     * @param paperIds Danh sách ID bài
     * @param paperData Metadata bài
     * @param reviewerIds Danh sách ID reviewer
     * @param reviewerData Metadata reviewer
     * @param maxPapersPerReviewer Số bài tối đa mỗi reviewer
     * @param minReviewersPerPaper Số reviewer tối thiểu mỗi bài
     * @return Gợi ý phân công
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
            // Get COI exclusions
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
            
            // Convert data formats
            Map<String, Map<String, Object>> paperDataStr = new HashMap<>();
            for (Map.Entry<Long, Map<String, Object>> entry : paperData.entrySet()) {
                paperDataStr.put(entry.getKey().toString(), entry.getValue());
            }
            
            Map<String, Map<String, Object>> reviewerDataStr = new HashMap<>();
            for (Map.Entry<Long, Map<String, Object>> entry : reviewerData.entrySet()) {
                reviewerDataStr.put(entry.getKey().toString(), entry.getValue());
            }
            
            // Prepare request
            Map<String, Object> request = new HashMap<>();
            request.put("conference_id", conferenceId.toString());
            request.put("paper_ids", paperIds.stream().map(String::valueOf).toList());
            request.put("paper_data", paperDataStr);
            request.put("reviewer_ids", reviewerIds.stream().map(String::valueOf).toList());
            request.put("reviewer_data", reviewerDataStr);
            
            Map<String, Object> constraints = new HashMap<>();
            constraints.put("max_papers_per_reviewer", maxPapersPerReviewer);
            constraints.put("min_reviewers_per_paper", minReviewersPerPaper);
            constraints.put("coi_exclusions", coiExclusions);
            constraints.put("workload_balance", true);
            request.put("constraints", constraints);
            
            // Call AI service
            @SuppressWarnings("unchecked")
            Map<String, Object> response = (Map<String, Object>) aiProxyService.callAIService(
                    "/api/v1/assignment/suggest-assignments",
                    request,
                    Map.class
            );
            
                logger.info("Đã nhận đề xuất phân công: {} phân công cho {} bài", 
                    ((List<?>) response.get("suggested_assignments")).size(),
                    paperIds.size());
            
            return response;
            
        } catch (Exception e) {
            logger.error("Lỗi khi lấy đề xuất phân công", e);
            throw new RuntimeException("Lấy đề xuất phân công thất bại: " + e.getMessage(), e);
        }
    }

    /**
     * Kiểm tra ràng buộc xung đột lợi ích (COI) cho phân công.
     *
     * @param paperId ID bài
     * @param reviewerId ID reviewer
     * @return true nếu hợp lệ (không có COI), false nếu có COI
     */
    public boolean validateAssignmentAgainstCOI(Long paperId, Long reviewerId) {
        boolean hasCOI = coiRepository.existsByPaperIdAndReviewerId(paperId, reviewerId);
        if (hasCOI) {
            logger.warn("Phát hiện xung đột lợi ích (COI): Bài {} và Reviewer {}", paperId, reviewerId);
        }
        return !hasCOI;
    }
}

