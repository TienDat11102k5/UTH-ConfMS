package edu.uth.backend.ai.dto;

import lombok.Data;

@Data
public class PolishRequest {
    private String content;
    private String type; // "abstract" (tóm tắt), "title" (tiêu đề), "paragraph" (đoạn văn)
    private Long conferenceId;
}
