package edu.uth.backend.ai.dto;

public class PolishResponse {
    private String originalText;
    private String polishedText;
    private String comment; // Giải thích ngắn gọn về thay đổi

    public PolishResponse() {}

    public String getOriginalText() {
        return originalText;
    }

    public void setOriginalText(String originalText) {
        this.originalText = originalText;
    }

    public String getPolishedText() {
        return polishedText;
    }

    public void setPolishedText(String polishedText) {
        this.polishedText = polishedText;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}
