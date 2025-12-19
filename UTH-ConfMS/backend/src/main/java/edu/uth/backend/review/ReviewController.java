package edu.uth.backend.review;

import edu.uth.backend.review.dto.ReviewRequestDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    // API: Gửi bài chấm
    // POST /api/reviews
    @PostMapping
    public ResponseEntity<?> submitReview(@RequestBody ReviewRequestDTO req) {
        try {
            return ResponseEntity.ok(reviewService.submitReview(
                req.getAssignmentId(),
                req.getScore(),
                req.getConfidenceLevel(),
                req.getCommentForAuthor(),
                req.getCommentForPC()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API: Lấy tất cả reviews của một paper (Chair xem)
    // GET /api/reviews/paper/{paperId}
    @GetMapping("/paper/{paperId}")
    public ResponseEntity<?> getReviewsByPaper(@PathVariable Long paperId) {
        return ResponseEntity.ok(reviewService.getReviewsByPaper(paperId));
    }

    // API: Lấy review của một assignment cụ thể
    // GET /api/reviews/assignment/{assignmentId}
    @GetMapping("/assignment/{assignmentId}")
    public ResponseEntity<?> getReviewByAssignment(@PathVariable Long assignmentId) {
        return ResponseEntity.ok(reviewService.getReviewByAssignment(assignmentId));
    }
}