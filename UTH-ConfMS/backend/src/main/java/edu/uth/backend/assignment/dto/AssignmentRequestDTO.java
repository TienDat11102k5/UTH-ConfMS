package edu.uth.backend.assignment.dto;

import lombok.Data;

@Data
public class AssignmentRequestDTO {
    private Long paperId;    // ID bài báo cần chấm
    private Long reviewerId; // ID người chấm (Reviewer)
}