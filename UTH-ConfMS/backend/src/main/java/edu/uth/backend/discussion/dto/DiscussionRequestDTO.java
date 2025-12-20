package edu.uth.backend.discussion.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DiscussionRequestDTO {
    private Long paperId;
    private Long authorId;
    private String content;
    private Long parentId; // null nếu là comment gốc
}
