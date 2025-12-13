package edu.uth.backend.submission;

import com.fasterxml.jackson.core.type.TypeReference; // <--- Import Jackson
import com.fasterxml.jackson.databind.ObjectMapper;   // <--- Import Jackson
import edu.uth.backend.entity.Paper;
import edu.uth.backend.submission.dto.CoAuthorDTO;    // <--- Import DTO
import edu.uth.backend.submission.dto.PaperResponseDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/submissions")
@CrossOrigin(origins = "*")
public class SubmissionController {

    @Autowired
    private SubmissionService submissionService;
    
    // Gọi Jackson ObjectMapper để xử lý JSON String
    private final ObjectMapper objectMapper = new ObjectMapper(); 

    // API: Nộp bài báo mới
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> submitPaper(
            @RequestParam String title,
            @RequestParam("abstract") String abstractText,
            @RequestParam Long authorId,
            @RequestParam Long trackId,
            @RequestParam MultipartFile file,
            // Nhận chuỗi JSON đồng tác giả (Không bắt buộc)
            @RequestParam(value = "coAuthors", required = false) String coAuthorsJson 
    ) {
        try {
            // 1. Convert String JSON -> List Object (Đoạn code mới)
            List<CoAuthorDTO> coAuthors = new ArrayList<>();
            if (coAuthorsJson != null && !coAuthorsJson.isEmpty()) {
                try {
                    // Dịch chuỗi JSON thành List<CoAuthorDTO>
                    coAuthors = objectMapper.readValue(coAuthorsJson, new TypeReference<List<CoAuthorDTO>>(){});
                } catch (Exception e) {
                    throw new RuntimeException("Lỗi định dạng JSON đồng tác giả: " + e.getMessage());
                }
            }

            // 2. Gọi Service để xử lý logic và lưu xuống DB (Truyền thêm list coAuthors)
            Paper paper = submissionService.submitPaper(title, abstractText, authorId, trackId, file, coAuthors);

            // 3. CHUYỂN ĐỔI ENTITY -> DTO (Mapping)
            PaperResponseDTO response = new PaperResponseDTO();
            response.setId(paper.getId());
            response.setTitle(paper.getTitle());
            response.setAbstractText(paper.getAbstractText());
            response.setFilePath(paper.getFilePath());
            response.setStatus(paper.getStatus().toString());

            // Map thông tin Tác giả
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

            // 4. Trả về DTO đẹp đẽ
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}