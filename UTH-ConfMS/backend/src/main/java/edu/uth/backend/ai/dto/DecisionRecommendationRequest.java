package edu.uth.backend.ai.dto;

import lombok.Data;
import java.util.List;

@Data
public class DecisionRecommendationRequest {
    private Long paperId;
    private String paperTitle;
    private List<ReviewData> reviews;
    private Double averageScore;
    private Long conferenceId;
    
    @Data
    public static class ReviewData {
        private Integer score;
        private String comment;
        private String recommendation;
    }
}
