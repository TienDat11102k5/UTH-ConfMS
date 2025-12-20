package edu.uth.backend.ai.dto;

import lombok.Data;
import java.util.List;

@Data
public class AssignmentSuggestionResponse {
    private List<Assignment> assignments;

    @Data
    public static class Assignment {
        private String paperId;
        private String reviewerId;
        private String reason;
    }
}
