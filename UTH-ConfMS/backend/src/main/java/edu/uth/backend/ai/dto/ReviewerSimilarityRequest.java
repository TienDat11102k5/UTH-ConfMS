package edu.uth.backend.ai.dto;

import lombok.Data;
import java.util.List;

@Data
public class ReviewerSimilarityRequest {
    private String paperTitle;
    private String paperKeywords; // Phân tách bằng dấu phẩy
    private List<ReviewerInfo> reviewers;
    private Long conferenceId;

    @Data
    public static class ReviewerInfo {
        private String id;
        private String name;
        private String expertise; // Từ khóa hoặc mô tả chuyên môn
    }
}
