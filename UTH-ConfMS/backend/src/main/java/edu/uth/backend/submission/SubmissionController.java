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
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/submissions")
public class SubmissionController {

    private static final Logger logger = LoggerFactory.getLogger(SubmissionController.class);

    @Autowired
    private SubmissionService submissionService;

    @Autowired
    private UserRepository userRepository; // <--- SỬA: Inject Repository trực tiếp
    
    @Autowired
    private edu.uth.backend.repository.ReviewAssignmentRepository reviewAssignmentRepository;
    
    @Autowired
    private edu.uth.backend.security.AuditLogger auditLogger;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.base.url:http://localhost:8080}")
    private String baseUrl;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

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
        
        // Audit log
        auditLogger.logPaperSubmission(paper.getId(), paper.getTitle(), currentUser.getEmail(), getClientIp());
        
        return ResponseEntity.status(HttpStatus.CREATED).body(mapToDTO(paper));
    }
    
    private String getClientIp() {
        try {
            jakarta.servlet.http.HttpServletRequest request = 
                ((org.springframework.web.context.request.ServletRequestAttributes) 
                org.springframework.web.context.request.RequestContextHolder.getRequestAttributes()).getRequest();
            String xForwardedFor = request.getHeader("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                return xForwardedFor.split(",")[0].trim();
            }
            return request.getRemoteAddr();
        } catch (Exception e) {
            return "unknown";
        }
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

    // ==================== 6. TẢI XUỐNG FILE BÀI BÁO ====================
    /**
     * Download paper file - accessible by:
     * - Paper author (main author)
     * - Reviewers assigned to this paper
     * - Chairs and Admins
     */
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}/download")
    public ResponseEntity<?> downloadPaper(@PathVariable Long id, Authentication authentication) {
        try {
            logger.info("Download request for paper ID: {} by user: {}", id, authentication.getName());
            
            // Get paper
            Paper paper = submissionService.getPaperById(id);
            
            // Get current user
            User currentUser = getCurrentUser(authentication);
            
            // Check access permission
            boolean hasAccess = checkDownloadAccess(paper, currentUser);
            
            if (!hasAccess) {
                logger.warn("User {} denied access to download paper {}", currentUser.getEmail(), id);
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Bạn không có quyền tải xuống file này");
            }
            
            // Get file path
            String filePath = paper.getFilePath();
            if (filePath == null || filePath.isEmpty()) {
                logger.error("No file path found for paper {}", id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Không tìm thấy file cho bài báo này");
            }
            
            // Build full path
            Path path = Paths.get(uploadDir).resolve("submissions").resolve(filePath).normalize();
            logger.info("Attempting to load file from: {}", path.toAbsolutePath());
            
            Resource resource = new UrlResource(path.toUri());
            
            if (resource.exists() && resource.isReadable()) {
                logger.info("File found and readable: {}", resource.getFilename());
                
                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_PDF)
                        .header(HttpHeaders.CONTENT_DISPOSITION, 
                                "inline; filename=\"" + resource.getFilename() + "\"")
                        .header(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, "Content-Disposition")
                        .body(resource);
            } else {
                logger.error("File not found or not readable at path: {}", path.toAbsolutePath());
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("File không tồn tại hoặc không thể đọc được");
            }
            
        } catch (Exception e) {
            logger.error("Error downloading paper {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi tải xuống file: " + e.getMessage());
        }
    }

    // --- HELPER METHODS ---
    
    /**
     * Check if user has permission to download paper file
     * Access granted to:
     * - Paper author (main author)
     * - Reviewers assigned to this paper
     * - Users with ADMIN, CHAIR, or TRACK_CHAIR role
     */
    private boolean checkDownloadAccess(Paper paper, User user) {
        // 1. Check if user is the main author
        if (paper.getMainAuthor() != null && paper.getMainAuthor().getId().equals(user.getId())) {
            logger.info("Access granted: User is main author");
            return true;
        }
        
        // 2. Check if user has admin/chair role
        boolean isAdminOrChair = user.getRoles().stream()
                .anyMatch(role -> {
                    String roleName = role.getName();
                    return "ROLE_ADMIN".equals(roleName) || 
                           "ROLE_CHAIR".equals(roleName) || 
                           "ROLE_TRACK_CHAIR".equals(roleName);
                });
        
        if (isAdminOrChair) {
            logger.info("Access granted: User has admin/chair role");
            return true;
        }
        
        // 3. Check if user is assigned as reviewer for this paper
        // Query ReviewAssignment table directly
        boolean isAssignedReviewer = reviewAssignmentRepository
                .existsByPaperIdAndReviewerId(paper.getId(), user.getId());
        
        if (isAssignedReviewer) {
            logger.info("Access granted: User is assigned reviewer for paper {}", paper.getId());
            return true;
        }
        
        logger.info("Access denied: User {} has no permission to access paper {}", user.getEmail(), paper.getId());
        return false;
    }

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