package edu.uth.backend.proceedings.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProgramPaperDTO {
    private Long paperId;
    private String title;
    private String authorName;
    private String coAuthors;
    private String presentationTime;
}
