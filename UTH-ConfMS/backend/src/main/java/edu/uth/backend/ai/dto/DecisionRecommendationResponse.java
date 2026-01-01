package edu.uth.backend.ai.dto;

import lombok.Data;
import java.util.List;

@Data
public class DecisionRecommendationResponse {
    private String recommendation; // "ACCEPT", "REJECT", "REVISE"
    private Integer confidence; // 0-100
    private String reasoning;
    private List<String> strengths;
    private List<String> weaknesses;
    private String summary;
}
