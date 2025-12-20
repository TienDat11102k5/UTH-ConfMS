package edu.uth.backend.discussion.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DiscussionResponseDTO {
    private Long id;
    private Long paperId;
    private String paperTitle;
    private Long authorId;
    private String authorName;
    private String content;
    private Long parentId;
    private LocalDateTime createdAt;
    private Boolean isVisible;
}
