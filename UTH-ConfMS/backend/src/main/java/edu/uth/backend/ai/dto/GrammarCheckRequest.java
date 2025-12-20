package edu.uth.backend.ai.dto;

import lombok.Data;

@Data
public class GrammarCheckRequest {
    private String text;
    private String fieldName; // "Title" (Tiêu đề), "Abstract" (Tóm tắt), "Content" (Nội dung)
    private Long conferenceId;
}
