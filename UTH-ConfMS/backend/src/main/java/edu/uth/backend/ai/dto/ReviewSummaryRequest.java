package edu.uth.backend.ai.dto;

import lombok.Data;
import java.util.List;

@Data
public class ReviewSummaryRequest {
    private Long paperId;
    private String paperTitle;
    private List<ReviewData> reviews;
    private Long conferenceId;
    
    @Data
    public static class ReviewData {
        private String reviewerName;
        private Integer score;
        private String comment;
        private String recommendation;
    }
}
