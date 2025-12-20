package edu.uth.backend.ai.dto;

import lombok.Data;
import java.util.Map;

@Data
public class ReviewerSimilarityResponse {
    // Map of Reviewer ID -> Similarity Score (0-100)
    private Map<String, Integer> similarityScores;
    private Map<String, String> reasoning; // Reviewer ID -> Reason
}
