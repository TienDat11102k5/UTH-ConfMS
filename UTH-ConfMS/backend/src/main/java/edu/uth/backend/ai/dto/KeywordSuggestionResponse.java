package edu.uth.backend.ai.dto;

import java.util.List;

public class KeywordSuggestionResponse {
    private List<String> keywords;

    public KeywordSuggestionResponse() {}

    public KeywordSuggestionResponse(List<String> keywords) {
        this.keywords = keywords;
    }

    public List<String> getKeywords() {
        return keywords;
    }

    public void setKeywords(List<String> keywords) {
        this.keywords = keywords;
    }
}
