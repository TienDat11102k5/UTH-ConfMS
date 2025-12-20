package edu.uth.backend.ai.dto;

import lombok.Data;

@Data
public class EmailDraftResponse {
    private String subject;
    private String body;
    private String language;
}
