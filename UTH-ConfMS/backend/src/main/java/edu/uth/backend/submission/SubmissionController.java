package edu.uth.backend.submission;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.uth.backend.entity.Paper;
import edu.uth.backend.entity.User;
import edu.uth.backend.repository.UserRepository; 
import edu.uth.backend.submission.dto.CoAuthorDTO;
import edu.uth.backend.submission.dto.PaperResponseDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Value;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/submissions")
@CrossOrigin(origins = "*")
public class SubmissionController {

    @Autowired
    private SubmissionService submissionService;

    @Autowired
    private UserRepository userRepository; // <--- SỬA: Inject Repository trực tiếp

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.base.url:http://localhost:8080}")
    private String baseUrl;

    // ==================== 1. NỘP BÀI ====================
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> submitPaper(
            @RequestParam String title,
            @RequestParam("abstract") String abstractText,
            @RequestParam Long trackId,
            @RequestParam MultipartFile file,
            @RequestParam(value = "coAuthors", required = false) String coAuthorsJson,
            Authentication authentication
    ) {
        try {
            // Lấy User từ Token (Sửa đoạn này)
            User currentUser = getCurrentUser(authentication);

            // Parse Co-Authors
            List<CoAuthorDTO> coAuthors = new ArrayList<>();
            if (coAuthorsJson != null && !coAuthorsJson.isEmpty()) {
                coAuthors = objectMapper.readValue(coAuthorsJson, new TypeReference<List<CoAuthorDTO>>(){});
            }

            Paper paper = submissionService.submitPaper(title, abstractText, currentUser.getId(), trackId, file, coAuthors);
            return ResponseEntity.status(HttpStatus.CREATED).body(mapToDTO(paper));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi nộp bài: " + e.getMessage());
        }
    }

    // ==================== 2. XEM CHI TIẾT ====================
    @GetMapping("/{id}")
    public ResponseEntity<?> getSubmission(@PathVariable Long id) {
        try {
            Paper paper = submissionService.getPaperById(id);
            return ResponseEntity.ok(mapToDTO(paper));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy bài báo.");
        }
    }

    // ==================== 3. XEM LIST CỦA TÔI ====================
    @GetMapping
    public ResponseEntity<?> getMySubmissions(Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);
            List<Paper> papers = submissionService.getPapersByAuthor(currentUser.getId());
            
            List<PaperResponseDTO> dtos = papers.stream().map(this::mapToDTO).collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi lấy danh sách: " + e.getMessage());
        }
    }

    // ==================== 4. SỬA BÀI (PUT) ====================
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateSubmission(
            @PathVariable Long id,
            @RequestParam String title,
            @RequestParam("abstract") String abstractText,
            @RequestParam(value = "file", required = false) MultipartFile file,
            Authentication authentication
    ) {
        try {
            User currentUser = getCurrentUser(authentication);
            // Ownership check
            Paper existing = submissionService.getPaperById(id);
            if (existing.getMainAuthor() == null || !existing.getMainAuthor().getId().equals(currentUser.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Bạn không có quyền sửa bài này");
            }

            Paper updatedPaper = submissionService.updatePaper(id, title, abstractText, file, currentUser.getId());
            return ResponseEntity.ok(mapToDTO(updatedPaper));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi cập nhật: " + e.getMessage());
        }
    }

    // ==================== 5. RÚT BÀI ====================
    @PostMapping("/{id}/withdraw")
    public ResponseEntity<?> withdrawSubmission(@PathVariable Long id, Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);
            Paper existing = submissionService.getPaperById(id);
            if (existing.getMainAuthor() == null || !existing.getMainAuthor().getId().equals(currentUser.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Bạn không có quyền rút bài này");
            }
            submissionService.withdrawPaper(id, currentUser.getId());
            return ResponseEntity.ok("Đã rút bài báo thành công.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // --- HELPER METHODS ---

    // Sửa hàm này để dùng UserRepository
    private User getCurrentUser(Authentication authentication) {
        if (authentication == null) throw new RuntimeException("Vui lòng đăng nhập!");
        String email = authentication.getName();
        
        // Dùng userRepository tìm email
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User không tồn tại: " + email));
    }

    private PaperResponseDTO mapToDTO(Paper paper) {
        PaperResponseDTO response = new PaperResponseDTO();
        response.setId(paper.getId());
        response.setTitle(paper.getTitle());
        response.setAbstractText(paper.getAbstractText());
        response.setFilePath(paper.getFilePath());
        if (paper.getStatus() != null) response.setStatus(paper.getStatus().toString());

        if (paper.getMainAuthor() != null) {
            response.setAuthorId(paper.getMainAuthor().getId());
            response.setAuthorName(paper.getMainAuthor().getFullName());
        }
        if (paper.getTrack() != null) {
            response.setTrackName(paper.getTrack().getName());
            if (paper.getTrack().getConference() != null) {
                response.setConferenceName(paper.getTrack().getConference().getName());
            }
        }
        // Map co-authors
        if (paper.getCoAuthors() != null && !paper.getCoAuthors().isEmpty()) {
            List<CoAuthorDTO> ca = paper.getCoAuthors().stream().map(c -> {
                CoAuthorDTO dto = new CoAuthorDTO();
                dto.setName(c.getName());
                dto.setEmail(c.getEmail());
                dto.setAffiliation(c.getAffiliation());
                return dto;
            }).collect(Collectors.toList());
            response.setCoAuthors(ca);
        }

        // Provide download URL for frontend
        if (paper.getFilePath() != null && !paper.getFilePath().isBlank()) {
            response.setDownloadUrl(baseUrl + "/uploads/submissions/" + paper.getFilePath());
        }
        return response;
    }
}