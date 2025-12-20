package edu.uth.backend.ai.dto;

import lombok.Data;
import java.util.List;

@Data
public class AssignmentSuggestionRequest {
    private List<String> paperIds;
    private List<String> reviewerIds;
    private String papersMetadata; // Chuỗi JSON hoặc mô tả các bài báo
    private String reviewersMetadata; // Chuỗi JSON hoặc mô tả các reviewer
    private String constraints; // ví dụ: "tối đa 3 bài mỗi reviewer"
    private Long conferenceId;
}
