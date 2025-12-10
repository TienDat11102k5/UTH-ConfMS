package edu.uth.backend.review.dto;

import lombok.Data;

@Data
public class ReviewRequestDTO {
    private Long assignmentId;     
    private Integer score;         
    private Integer confidenceLevel;
    private String commentForAuthor;
    private String commentForPC;    
}