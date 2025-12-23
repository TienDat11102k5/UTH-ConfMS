package edu.uth.backend.proceedings.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ProceedingsDTO {
    private Long paperId;
    private String trackName;
    private String title;
    private String authorName;
    private String coAuthors;
    private String abstractText;
    private String pdfUrl;
}