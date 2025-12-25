package edu.uth.backend.decision;

import edu.uth.backend.entity.PaperStatus;
import lombok.extern.slf4j.Slf4j;
import edu.uth.backend.decision.dto.DecisionRequestDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import edu.uth.backend.submission.SubmissionService;

@Slf4j
@RestController
@RequestMapping("/api/decisions")
public class DecisionController {

    @Autowired
    private DecisionService decisionService;

    @Autowired
    private SubmissionService submissionService;

    // API: Xem điểm trung bình của bài báo
    @GetMapping("/score/{paperId}")
    @org.springframework.security.access.prepost.PreAuthorize(
            "hasAnyAuthority('ROLE_ADMIN','ROLE_CHAIR','ROLE_TRACK_CHAIR')")
    public ResponseEntity<?> getAverageScore(@PathVariable Long paperId) {
        log.info("Get average score - paperId={}", paperId);
        return ResponseEntity.ok(decisionService.calculateAverageScore(paperId));
    }

    // API: Ra quyết định (Accept/Reject)
    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize(
            "hasAnyAuthority('ROLE_ADMIN','ROLE_CHAIR','ROLE_TRACK_CHAIR')")
    public ResponseEntity<?> makeDecision(@RequestBody DecisionRequestDTO req) {
        log.info("Make decision - paperId={}, status={}",
                req.getPaperId(), req.getStatus());
        try {
            var result = decisionService.makeDecision(
                    req.getPaperId(),
                    req.getStatus(),
                    req.getComment()
            );
            log.info("Make decision success - paperId={}, status={}",
                    req.getPaperId(), req.getStatus());
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            log.error("Make decision failed - paperId={}, error={}",
                    req.getPaperId(), e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API: Bulk decision
    @PostMapping("/bulk")
    @org.springframework.security.access.prepost.PreAuthorize(
            "hasAnyAuthority('ROLE_ADMIN','ROLE_CHAIR','ROLE_TRACK_CHAIR')")
    public ResponseEntity<?> bulkMakeDecision(@RequestBody java.util.Map<String, Object> request) {
        log.info("Bulk decision request received");
        try {
            java.util.List<?> rawIds = (java.util.List<?>) request.get("paperIds");
            java.util.List<Long> paperIds =
                    rawIds.stream().map(id -> ((Number) id).longValue()).toList();
            String statusStr = (String) request.get("status");
            PaperStatus status = PaperStatus.valueOf(statusStr);
            String comment = (String) request.getOrDefault("comment", "");

            var result = decisionService.bulkMakeDecision(paperIds, status, comment);
            log.info("Bulk decision success - paperCount={}, status={}",
                    paperIds.size(), status);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Bulk decision failed - error={}", e.getMessage());
            return ResponseEntity.badRequest().body("Lỗi: " + e.getMessage());
        }
    }

    // API: Thống kê review của paper
    @GetMapping("/statistics/{paperId}")
    @org.springframework.security.access.prepost.PreAuthorize(
            "hasAnyAuthority('ROLE_ADMIN','ROLE_CHAIR','ROLE_TRACK_CHAIR')")
    public ResponseEntity<?> getReviewStatistics(@PathVariable Long paperId) {
        log.info("Get review statistics - paperId={}", paperId);
        return ResponseEntity.ok(decisionService.getReviewStatistics(paperId));
    }

    // API: Danh sách paper theo conference
    @GetMapping("/papers/{conferenceId}")
    @org.springframework.security.access.prepost.PreAuthorize(
            "hasAnyAuthority('ROLE_ADMIN','ROLE_CHAIR','ROLE_TRACK_CHAIR')")
    public ResponseEntity<?> getConferencePapers(@PathVariable Long conferenceId) {
        log.info("Get conference papers - conferenceId={}", conferenceId);
        return ResponseEntity.ok(
                submissionService.getPapersByConference(conferenceId)
        );
    }

    // API: Lấy danh sách reviewer
    @GetMapping("/reviewers")
    @org.springframework.security.access.prepost.PreAuthorize(
            "hasAnyAuthority('ROLE_ADMIN','ROLE_CHAIR','ROLE_TRACK_CHAIR')")
    public ResponseEntity<?> getReviewers() {
        log.info("Get reviewers list");
        return ResponseEntity.ok(submissionService.getAllReviewers());
    }

    // API: Author xem decision của paper
    @GetMapping("/paper/{paperId}")
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getDecisionByPaper(@PathVariable Long paperId) {
        log.info("Get decision by paper - paperId={}", paperId);
        try {
            return ResponseEntity.ok(
                    decisionService.getDecisionByPaper(paperId)
            );
        } catch (RuntimeException e) {
            log.error("Get decision failed - paperId={}, error={}",
                    paperId, e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
