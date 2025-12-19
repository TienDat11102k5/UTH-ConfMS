package edu.uth.backend.decision;

import edu.uth.backend.entity.PaperStatus;

import edu.uth.backend.decision.dto.DecisionRequestDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import edu.uth.backend.submission.SubmissionService;

@RestController
@RequestMapping("/api/decisions")
@CrossOrigin(origins = "*")
public class DecisionController {

    @Autowired
    private DecisionService decisionService;

    @Autowired
    private SubmissionService submissionService;

    // API: Xem điểm trung bình của bài báo (Chair tham khảo)
    // GET /api/decisions/score/{paperId}
    @GetMapping("/score/{paperId}")
    public ResponseEntity<?> getAverageScore(@PathVariable Long paperId) {
        return ResponseEntity.ok(decisionService.calculateAverageScore(paperId));
    }

    // API: Ra quyết định (Accept/Reject)
    // POST /api/decisions
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_CHAIR','ROLE_TRACK_CHAIR')")
    @PostMapping
    public ResponseEntity<?> makeDecision(@RequestBody DecisionRequestDTO req) {
        try {
            return ResponseEntity.ok(decisionService.makeDecision(req.getPaperId(), req.getStatus(), req.getComment()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API: Bulk decision - ra quyết định cho nhiều bài
    // POST /api/decisions/bulk
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_CHAIR','ROLE_TRACK_CHAIR')")
    @PostMapping("/bulk")
    public ResponseEntity<?> bulkMakeDecision(@RequestBody java.util.Map<String, Object> request) {
        try {
            java.util.List<?> rawIds = (java.util.List<?>) request.get("paperIds");
            java.util.List<Long> paperIds = rawIds.stream().map(id -> ((Number) id).longValue()).toList();
            String statusStr = (String) request.get("status");
            PaperStatus status = PaperStatus.valueOf(statusStr);
            String comment = (String) request.getOrDefault("comment", "");
            return ResponseEntity.ok(decisionService.bulkMakeDecision(paperIds, status, comment));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi: " + e.getMessage());
        }
    }

    // API: Lấy thống kê reviews của một paper
    // GET /api/decisions/statistics/{paperId}
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_CHAIR','ROLE_TRACK_CHAIR')")
    @GetMapping("/statistics/{paperId}")
    public ResponseEntity<?> getReviewStatistics(@PathVariable Long paperId) {
        return ResponseEntity.ok(decisionService.getReviewStatistics(paperId));
    }

    // API: Lấy danh sách bài báo theo hội nghị (Dành cho Chair)
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_CHAIR','ROLE_TRACK_CHAIR')")
    @GetMapping("/papers/{conferenceId}")
    public ResponseEntity<?> getConferencePapers(@PathVariable Long conferenceId) {
        return ResponseEntity.ok(submissionService.getPapersByConference(conferenceId));
    }

    // API: Lấy danh sách Reviewer (Dành cho Chair phân công)
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_CHAIR','ROLE_TRACK_CHAIR')")
    @GetMapping("/reviewers")
    public ResponseEntity<?> getReviewers() {
        return ResponseEntity.ok(submissionService.getAllReviewers());
    }
}