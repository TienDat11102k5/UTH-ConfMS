package edu.uth.backend.proceedings.dto;

import lombok.Data;

@Data
public class ProceedingsDTO {
    private String trackName;
    private String title;
    private String authorName;
    private String abstractText;
    private String pdfUrl;

    // Constructor
    public ProceedingsDTO(String trackName, String title, String authorName, String abstractText, String pdfUrl) {
        this.trackName = trackName;
        this.title = title;
        this.authorName = authorName;
        this.abstractText = abstractText;
        this.pdfUrl = pdfUrl;
    }
}