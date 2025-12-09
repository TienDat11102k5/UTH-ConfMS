package edu.uth.backend.submission;

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
    // POST /api/submissions
    // Content-Type: multipart/form-data (Quan trọng!)
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> submitPaper(
            @RequestParam("title") String title,
            @RequestParam("abstract") String abstractText,
            @RequestParam("authorId") Long authorId,
            @RequestParam("trackId") Long trackId,
            @RequestParam("file") MultipartFile file
    ) {
        try {
            return ResponseEntity.ok(submissionService.submitPaper(title, abstractText, authorId, trackId, file));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}