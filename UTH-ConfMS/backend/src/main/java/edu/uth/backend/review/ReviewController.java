package edu.uth.backend.review;

import edu.uth.backend.review.dto.ReviewRequestDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;
    
    @Autowired
    private edu.uth.backend.security.AuditLogger auditLogger;

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_REVIEWER','ROLE_PC')")
    public ResponseEntity<?> submitReview(@RequestBody ReviewRequestDTO req, 
            org.springframework.security.core.Authentication authentication) {
        log.info("Submit review - assignmentId={}", req.getAssignmentId());
        try {
            var review = reviewService.submitReview(
                req.getAssignmentId(),
                req.getScore(),
                req.getConfidenceLevel(),
                req.getCommentForAuthor(),
                req.getCommentForPC()
            );
            
            // Audit log
            String reviewer = authentication != null ? authentication.getName() : "unknown";
            auditLogger.logReviewSubmission(review.getId(), review.getAssignment().getPaper().getId(), 
                reviewer, getClientIp());
            
            return ResponseEntity.ok(review);
        } catch (RuntimeException e) {
            log.error("Submit review failed - assignmentId={}", req.getAssignmentId(), e);
            return ResponseEntity.badRequest().body(e.getMessage());
        }
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

    @GetMapping("/paper/{paperId}")
    public ResponseEntity<?> getReviewsByPaper(@PathVariable Long paperId) {
        log.info("Get reviews by paper - paperId={}", paperId);
        return ResponseEntity.ok(reviewService.getReviewsByPaper(paperId));
    }

    @GetMapping("/assignment/{assignmentId}")
    public ResponseEntity<?> getReviewByAssignment(@PathVariable Long assignmentId) {
        log.info("Get review by assignment - assignmentId={}", assignmentId);
        return ResponseEntity.ok(reviewService.getReviewByAssignment(assignmentId));
    }

    @GetMapping("/paper/{paperId}/for-author")
    public ResponseEntity<?> getReviewsForAuthor(@PathVariable Long paperId) {
        log.info("Get reviews for author - paperId={}", paperId);
        return ResponseEntity.ok(reviewService.getReviewsForAuthor(paperId));
    }
}
