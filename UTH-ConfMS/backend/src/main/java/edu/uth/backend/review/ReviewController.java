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
}