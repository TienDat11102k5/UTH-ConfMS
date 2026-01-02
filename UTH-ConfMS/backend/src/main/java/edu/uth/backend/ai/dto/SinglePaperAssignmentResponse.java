package edu.uth.backend.ai.dto;

import lombok.Data;
import java.util.List;

@Data
public class SinglePaperAssignmentResponse {
    private List<ReviewerSuggestion> suggestions;
    private String explanation;

    @Data
    public static class ReviewerSuggestion {
        private Long reviewerId;
        private String reviewerName;
        private Double similarityScore; // 0.0 - 1.0
        private String rationale;
    }
}
