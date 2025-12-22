package edu.uth.backend.cameraready;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/camera-ready")
@CrossOrigin(origins = "*")
public class CameraReadyController {

    @Autowired
    private CameraReadyService cameraReadyService;

    // POST /api/camera-ready/{paperId}
    @PostMapping(
            value = "/{paperId}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> submitCameraReady(
            @PathVariable Long paperId,
            @RequestParam("file") MultipartFile file
    ) {
        try {
            return ResponseEntity.ok(
                    cameraReadyService.submitCameraReady(paperId, file)
            );
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
