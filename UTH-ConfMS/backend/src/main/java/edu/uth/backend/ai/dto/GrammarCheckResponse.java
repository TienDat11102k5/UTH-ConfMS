package edu.uth.backend.ai.dto;

import java.util.List;

public class GrammarCheckResponse {
    private String originalText;
    private List<GrammarError> errors;
    private String correctedText;

    public GrammarCheckResponse() {}

    public String getOriginalText() {
        return originalText;
    }

    public void setOriginalText(String originalText) {
        this.originalText = originalText;
    }

    public List<GrammarError> getErrors() {
        return errors;
    }

    public void setErrors(List<GrammarError> errors) {
        this.errors = errors;
    }

    public String getCorrectedText() {
        return correctedText;
    }

    public void setCorrectedText(String correctedText) {
        this.correctedText = correctedText;
    }

    public static class GrammarError {
        private String message;
        private int offset;
        private int length;
        private List<String> replacements;

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public int getOffset() {
            return offset;
        }

        public void setOffset(int offset) {
            this.offset = offset;
        }

        public int getLength() {
            return length;
        }

        public void setLength(int length) {
            this.length = length;
        }

        public List<String> getReplacements() {
            return replacements;
        }

        public void setReplacements(List<String> replacements) {
            this.replacements = replacements;
        }
    }
}
