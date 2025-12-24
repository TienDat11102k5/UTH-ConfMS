package edu.uth.backend.report;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportController {

    @Autowired
    private ReportService reportService;

    // API: Báo cáo tổng hợp conference
    // GET /api/reports/conference/{conferenceId}
    @GetMapping("/conference/{conferenceId}")
    public ResponseEntity<?> getConferenceReport(@PathVariable Long conferenceId) {
        try {
            return ResponseEntity.ok(reportService.getConferenceReport(conferenceId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API: Báo cáo theo track
    // GET /api/reports/conference/{conferenceId}/tracks
    @GetMapping("/conference/{conferenceId}/tracks")
    public ResponseEntity<?> getTrackReport(@PathVariable Long conferenceId) {
        try {
            return ResponseEntity.ok(reportService.getTrackReport(conferenceId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API: Báo cáo tiến độ review
    // GET /api/reports/conference/{conferenceId}/review-progress
    @GetMapping("/conference/{conferenceId}/review-progress")
    public ResponseEntity<?> getReviewProgressReport(@PathVariable Long conferenceId) {
        try {
            return ResponseEntity.ok(reportService.getReviewProgressReport(conferenceId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API: Export papers cho proceedings
    // GET /api/reports/conference/{conferenceId}/export-proceedings
    @GetMapping("/conference/{conferenceId}/export-proceedings")
    public ResponseEntity<?> exportProceedings(@PathVariable Long conferenceId) {
        try {
            return ResponseEntity.ok(reportService.exportPapersForProceedings(conferenceId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
