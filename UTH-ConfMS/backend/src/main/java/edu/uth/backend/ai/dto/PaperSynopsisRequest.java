package edu.uth.backend.ai.dto;

import lombok.Data;

@Data
public class PaperSynopsisRequest {
    private String title;
    private String abstractText;
    private String language; // "en" hoặc "vi"
    private String length; // "short" (ngắn), "medium" (trung bình), "long" (dài)
    private Long conferenceId;
}
