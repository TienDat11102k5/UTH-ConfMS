package edu.uth.backend.submission;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.uth.backend.entity.Paper;
import edu.uth.backend.entity.User;
import edu.uth.backend.exception.ResourceNotFoundException;
import edu.uth.backend.repository.UserRepository; 
import edu.uth.backend.submission.dto.CoAuthorDTO;
import edu.uth.backend.submission.dto.PaperResponseDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

    private static final Logger logger = LoggerFactory.getLogger(SubmissionController.class);

    @Autowired
    private SubmissionService submissionService;

    @Autowired
    private UserRepository userRepository; // <--- SỬA: Inject Repository trực tiếp

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.base.url:http://localhost:8080}")
    private String baseUrl;

    // ==================== 1. NỘP BÀI ====================
    @PreAuthorize("isAuthenticated()")
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PaperResponseDTO> submitPaper(
            @RequestParam String title,
            @RequestParam("abstract") String abstractText,
            @RequestParam Long trackId,
            @RequestParam MultipartFile file,
            @RequestParam(value = "coAuthors", required = false) String coAuthorsJson,
            Authentication authentication
    ) {
        logger.info("Submission request received: title={}, trackId={}", title, trackId);
        
        // Lấy User từ Token
        User currentUser = getCurrentUser(authentication);

        // Parse Co-Authors
        List<CoAuthorDTO> coAuthors = new ArrayList<>();
        if (coAuthorsJson != null && !coAuthorsJson.isEmpty()) {
            try {
                coAuthors = objectMapper.readValue(coAuthorsJson, new TypeReference<List<CoAuthorDTO>>(){});
            } catch (Exception e) {
                logger.error("Failed to parse coAuthors JSON: {}", e.getMessage());
                throw new IllegalArgumentException("Dữ liệu đồng tác giả không hợp lệ");
            }
        }

        Paper paper = submissionService.submitPaper(title, abstractText, currentUser.getId(), trackId, file, coAuthors);
        logger.info("Paper submitted successfully: id={}", paper.getId());
        
        return ResponseEntity.status(HttpStatus.CREATED).body(mapToDTO(paper));
    }

    // ==================== 2. XEM CHI TIẾT ====================
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}")
    public ResponseEntity<PaperResponseDTO> getSubmission(@PathVariable Long id) {
        PaperResponseDTO dto = submissionService.getPaperDtoById(id);
        
        // DEBUG: Log camera ready info
        System.out.println("=== GET SUBMISSION DEBUG ===");
        System.out.println("Paper ID: " + id);
        System.out.println("Camera ready path in DTO: " + dto.getCameraReadyPath());
        System.out.println("Camera ready download URL in DTO: " + dto.getCameraReadyDownloadUrl());
        System.out.println("===========================");
        
        return ResponseEntity.ok(dto);
    }

    // ==================== 3. XEM LIST CỦA TÔI ====================
    @PreAuthorize("isAuthenticated()")
    @GetMapping
    public ResponseEntity<List<PaperResponseDTO>> getMySubmissions(
            Authentication authentication,
            @RequestParam(value = "conferenceId", required = false) Long conferenceId
    ) {
        User currentUser = getCurrentUser(authentication);
        List<Paper> papers = (conferenceId != null)
                ? submissionService.getPapersByAuthorAndConference(currentUser.getId(), conferenceId)
                : submissionService.getPapersByAuthor(currentUser.getId());
        
        List<PaperResponseDTO> dtos = papers.stream().map(this::mapToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // ==================== 4. SỬA BÀI (PUT) ====================
    @PreAuthorize("isAuthenticated()")
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PaperResponseDTO> updateSubmission(
            @PathVariable Long id,
            @RequestParam String title,
            @RequestParam("abstract") String abstractText,
            @RequestParam(value = "file", required = false) MultipartFile file,
            Authentication authentication
    ) {
        User currentUser = getCurrentUser(authentication);
        
        // Kiểm tra quyền sở hữu (chỉ tác giả chính được phép)
        Paper existing = submissionService.getPaperById(id);
        if (existing.getMainAuthor() == null || !existing.getMainAuthor().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Bạn không có quyền sửa bài này");
        }

        Paper updatedPaper = submissionService.updatePaper(id, title, abstractText, file, currentUser.getId());
        logger.info("Paper updated successfully: id={}", id);
        
        return ResponseEntity.ok(mapToDTO(updatedPaper));
    }

    // ==================== 5. RÚT BÀI ====================
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/{id}/withdraw")
    public ResponseEntity<String> withdrawSubmission(@PathVariable Long id, Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        
        Paper existing = submissionService.getPaperById(id);
        if (existing.getMainAuthor() == null || !existing.getMainAuthor().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Bạn không có quyền rút bài này");
        }
        
        submissionService.withdrawPaper(id, currentUser.getId());
        logger.info("Paper withdrawn successfully: id={}", id);
        
        return ResponseEntity.ok("Đã rút bài báo thành công.");
    }

    // --- HELPER METHODS ---

    private User getCurrentUser(Authentication authentication) {
        if (authentication == null) {
            throw new IllegalArgumentException("Vui lòng đăng nhập!");
        }
        String email = authentication.getName();
        
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    private PaperResponseDTO mapToDTO(Paper paper) {
        PaperResponseDTO response = new PaperResponseDTO();
        response.setId(paper.getId());
        response.setTitle(paper.getTitle());
        response.setAbstractText(paper.getAbstractText());
        response.setFilePath(paper.getFilePath());
        if (paper.getStatus() != null) response.setStatus(paper.getStatus().toString());

        // Thời gian tạo/cập nhật (dùng cho ngày nộp / ngày cập nhật)
        response.setCreatedAt(paper.getCreatedAt());
        response.setUpdatedAt(paper.getUpdatedAt());

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

        // Cung cấp URL tải về cho frontend
        if (paper.getFilePath() != null && !paper.getFilePath().isBlank()) {
            response.setDownloadUrl(baseUrl + "/uploads/submissions/" + paper.getFilePath());
        }
        if (paper.getCameraReadyPath() != null && !paper.getCameraReadyPath().isBlank()) {
            response.setCameraReadyPath(paper.getCameraReadyPath());
            response.setCameraReadyDownloadUrl(baseUrl + "/uploads/camera-ready/" + paper.getCameraReadyPath());
        }
        return response;
    }
}