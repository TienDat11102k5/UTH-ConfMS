package edu.uth.backend.proceedings;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/proceedings")
@CrossOrigin(origins = "*")
public class ProceedingsController {

    private static final Logger logger = LoggerFactory.getLogger(ProceedingsController.class);

    @Autowired
    private ProceedingsService proceedingsService;

    // API: Lấy danh sách kỷ yếu (Public)
    // GET /api/proceedings/{conferenceId}
    @GetMapping("/{conferenceId}")
    public ResponseEntity<?> getProceedings(@PathVariable Long conferenceId) {
        try {
            logger.info("GET /api/proceedings/{} - Fetching proceedings", conferenceId);
            var proceedings = proceedingsService.getConferenceProceedings(conferenceId);
            logger.info("Successfully fetched {} proceedings", proceedings.size());
            return ResponseEntity.ok(proceedings);
        } catch (Exception e) {
            logger.error("Error fetching proceedings for conference {}: {}", conferenceId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching proceedings: " + e.getMessage());
        }
    }

    // API: Lấy tất cả kỷ yếu từ mọi hội nghị (kể cả bị ẩn) - chỉ bài ACCEPTED
    // GET /api/proceedings/all
    @GetMapping("/all")
    public ResponseEntity<?> getAllProceedings() {
        try {
            logger.info("GET /api/proceedings/all - Fetching all proceedings");
            var proceedings = proceedingsService.getAllAcceptedProceedings();
            logger.info("Successfully fetched {} proceedings from all conferences", proceedings.size());
            return ResponseEntity.ok(proceedings);
        } catch (Exception e) {
            logger.error("Error fetching all proceedings: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching all proceedings: " + e.getMessage());
        }
    }

    // API: Test endpoint
    @GetMapping("/test")
    public ResponseEntity<?> test() {
        logger.info("Test endpoint called");
        return ResponseEntity.ok("Proceedings API is working!");
    }

    // API: Debug endpoint - kiểm tra file paths
    @GetMapping("/debug/{conferenceId}")
    public ResponseEntity<?> debugProceedings(@PathVariable Long conferenceId) {
        try {
            logger.info("Debug endpoint called for conference {}", conferenceId);
            var proceedings = proceedingsService.getConferenceProceedings(conferenceId);
            
            // Tạo debug info
            var debugInfo = proceedings.stream().map(p -> {
                var info = new java.util.HashMap<String, Object>();
                info.put("paperId", p.getPaperId());
                info.put("title", p.getTitle());
                info.put("pdfUrl", p.getPdfUrl());
                info.put("hasPdf", p.getPdfUrl() != null && !p.getPdfUrl().isEmpty());
                return info;
            }).toList();
            
            return ResponseEntity.ok(debugInfo);
        } catch (Exception e) {
            logger.error("Error in debug endpoint: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    // API: Download PDF của bài báo trong proceedings
    // GET /api/proceedings/download/{paperId}
    @GetMapping("/download/{paperId}")
    public ResponseEntity<?> downloadPaper(@PathVariable Long paperId) {
        try {
            logger.info("Download request for paper ID: {}", paperId);
            Resource resource = proceedingsService.getPaperFile(paperId);
            
            logger.info("Resource found: {}, exists: {}, readable: {}", 
                resource.getFilename(), resource.exists(), resource.isReadable());
            
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, 
                            "attachment; filename=\"" + resource.getFilename() + "\"")
                    .header(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, "Content-Disposition")
                    .body(resource);
        } catch (Exception e) {
            logger.error("Error downloading paper {}: {}", paperId, e.getMessage(), e);
            // Trả về JSON error thay vì plain text để frontend dễ xử lý
            var errorResponse = new java.util.HashMap<String, String>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("paperId", paperId.toString());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(errorResponse);
        }
    }

    // API: Export proceedings dạng JSON (cho Chair)
    // GET /api/proceedings/export/{conferenceId}
    @GetMapping("/export/{conferenceId}")
    public ResponseEntity<?> exportProceedings(@PathVariable Long conferenceId) {
        try {
            return ResponseEntity.ok(proceedingsService.exportProceedingsData(conferenceId));
        } catch (Exception e) {
            logger.error("Error exporting proceedings for conference {}: {}", conferenceId, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error exporting proceedings: " + e.getMessage());
        }
    }

    // API: Lấy chương trình hội nghị (Program) - nhóm theo track/session
    // GET /api/proceedings/program/{conferenceId}
    @GetMapping("/program/{conferenceId}")
    public ResponseEntity<?> getConferenceProgram(@PathVariable Long conferenceId) {
        try {
            logger.info("GET /api/proceedings/program/{} - Fetching conference program", conferenceId);
            var program = proceedingsService.getConferenceProgram(conferenceId);
            logger.info("Successfully fetched program with {} sessions", program.size());
            return ResponseEntity.ok(program);
        } catch (Exception e) {
            logger.error("Error fetching program for conference {}: {}", conferenceId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching program: " + e.getMessage());
        }
    }
}