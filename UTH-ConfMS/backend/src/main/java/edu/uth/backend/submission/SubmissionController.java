package edu.uth.backend.submission;

import edu.uth.backend.entity.Paper;
import edu.uth.backend.submission.dto.PaperResponseDTO; 
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/submissions")
@CrossOrigin(origins = "*")
public class SubmissionController {

    @Autowired
    private SubmissionService submissionService;

    // API: Nộp bài báo mới
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> submitPaper(
            @RequestParam("title") String title,
            @RequestParam("abstract") String abstractText,
            @RequestParam("authorId") Long authorId,
            @RequestParam("trackId") Long trackId,
            @RequestParam("file") MultipartFile file
    ) {
        try {
            // 1. Gọi Service để xử lý logic và lưu xuống DB (Vẫn trả về Entity)
            Paper paper = submissionService.submitPaper(title, abstractText, authorId, trackId, file);

            // 2. CHUYỂN ĐỔI ENTITY -> DTO (Mapping)
            PaperResponseDTO response = new PaperResponseDTO();
            response.setId(paper.getId());
            response.setTitle(paper.getTitle());
            response.setAbstractText(paper.getAbstractText());
            response.setFilePath(paper.getFilePath());
            response.setStatus(paper.getStatus().toString());

            // Map thông tin Tác giả (Chỉ lấy tên, bỏ qua password)
            if (paper.getMainAuthor() != null) {
                response.setAuthorId(paper.getMainAuthor().getId());
                response.setAuthorName(paper.getMainAuthor().getFullName());
            }

            // Map thông tin Track & Hội nghị
            if (paper.getTrack() != null) {
                response.setTrackName(paper.getTrack().getName());
                if (paper.getTrack().getConference() != null) {
                    response.setConferenceName(paper.getTrack().getConference().getName());
                }
            }

            // 3. Trả về DTO đẹp đẽ
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}