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

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_REVIEWER','ROLE_PC')")
    public ResponseEntity<?> submitReview(@RequestBody ReviewRequestDTO req) {
        log.info("Submit review - assignmentId={}", req.getAssignmentId());
        try {
            return ResponseEntity.ok(reviewService.submitReview(
                req.getAssignmentId(),
                req.getScore(),
                req.getConfidenceLevel(),
                req.getCommentForAuthor(),
                req.getCommentForPC()
            ));
        } catch (RuntimeException e) {
            log.error("Submit review failed - assignmentId={}", req.getAssignmentId(), e);
            return ResponseEntity.badRequest().body(e.getMessage());
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
