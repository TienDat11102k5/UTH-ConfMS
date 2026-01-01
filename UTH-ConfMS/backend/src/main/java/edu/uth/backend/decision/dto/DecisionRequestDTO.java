package edu.uth.backend.decision.dto;

import edu.uth.backend.entity.PaperStatus;
import lombok.Data;

@Data
public class DecisionRequestDTO {
    private Long paperId;
    private PaperStatus status;
    private String comment;
    private Boolean skipEmail; // true = không gửi email tự động (đã gửi bằng AI)
}