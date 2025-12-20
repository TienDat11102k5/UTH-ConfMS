package edu.uth.backend.ai.dto;

import lombok.Data;

@Data
public class KeywordSuggestionRequest {
    private String title;
    private String abstractText;
    private int maxKeywords = 5;
    private Long conferenceId;
}
