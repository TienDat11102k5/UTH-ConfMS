package edu.uth.backend.submission.dto;

import lombok.Data;

@Data
public class PaperResponseDTO {
    private Long id;
    private String title;
    private String abstractText;
    private String filePath;
    private String status;       // Trả về String cho Frontend dễ hiển thị
    private Long authorId;       // Chỉ trả về ID tác giả
    private String authorName;   // Chỉ trả về Tên tác giả (Che password)
    private String trackName;    // Tên Track
    private String conferenceName; // Tên Hội nghị (Thêm cái này cho đầy đủ)
}