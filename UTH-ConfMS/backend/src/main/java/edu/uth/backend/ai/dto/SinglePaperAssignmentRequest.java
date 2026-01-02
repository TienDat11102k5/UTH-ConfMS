package edu.uth.backend.ai.dto;

import lombok.Data;
import java.util.List;

@Data
public class SinglePaperAssignmentRequest {
    private Long paperId;
    private String paperTitle;
    private String paperAbstract;
    private List<String> paperKeywords;
    private List<ReviewerInfo> availableReviewers;
    private Long conferenceId;

    @Data
    public static class ReviewerInfo {
        private Long id;
        private String name;
        private String email;
        private List<String> expertise;
        private List<String> keywords;
    }
}
