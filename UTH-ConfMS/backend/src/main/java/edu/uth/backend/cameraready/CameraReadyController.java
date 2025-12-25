package edu.uth.backend.cameraready;

import edu.uth.backend.entity.Paper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/camera-ready")
@CrossOrigin(origins = "*")
public class CameraReadyController {

    @Autowired
    private CameraReadyService cameraReadyService;

    @Value("${app.base.url:http://localhost:8080}")
    private String baseUrl;

    // POST /api/camera-ready/{paperId}
    @PostMapping(
            value = "/{paperId}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> submitCameraReady(
            @PathVariable Long paperId,
            @RequestParam("file") MultipartFile file
    ) {
        log.info("POST /api/camera-ready/{} | filename={}, size={}",
                paperId,
                file != null ? file.getOriginalFilename() : "null",
                file != null ? file.getSize() : 0
        );

        try {
            Paper paper = cameraReadyService.submitCameraReady(paperId, file);

            log.info("Camera-ready uploaded successfully | paperId={}, path={}",
                    paper.getId(),
                    paper.getCameraReadyPath()
            );

            Map<String, Object> response = new HashMap<>();
            response.put("id", paper.getId());
            response.put("cameraReadyPath", paper.getCameraReadyPath());
            response.put("cameraReadyDownloadUrl",
                    baseUrl + "/uploads/camera-ready/" + paper.getCameraReadyPath());
            response.put("message", "Upload camera-ready thành công");

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            log.error("Error uploading camera-ready | paperId={}", paperId, e);
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
