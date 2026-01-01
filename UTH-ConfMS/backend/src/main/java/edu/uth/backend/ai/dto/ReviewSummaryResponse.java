package edu.uth.backend.ai.dto;

import lombok.Data;
import java.util.List;

@Data
public class ReviewSummaryResponse {
    private String overallSummary;
    private List<String> commonStrengths;
    private List<String> commonWeaknesses;
    private List<String> keyPoints;
    private String consensus;
}
