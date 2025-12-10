package edu.uth.backend.assignment;

import edu.uth.backend.assignment.dto.AssignmentRequestDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/assignments")
@CrossOrigin(origins = "*")
public class ReviewAssignmentController {

    @Autowired
    private ReviewAssignmentService assignmentService;

    // API: Phân công Reviewer (Admin/Chair dùng)
    // POST /api/assignments
    @PostMapping
    public ResponseEntity<?> assignReviewer(@RequestBody AssignmentRequestDTO req) {
        try {
            return ResponseEntity.ok(assignmentService.assignReviewer(req.getPaperId(), req.getReviewerId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API: Xem danh sách bài mình được phân công (Reviewer dùng)
    // GET /api/assignments/my-assignments?reviewerId=1
    @GetMapping("/my-assignments")
    public ResponseEntity<?> getMyAssignments(@RequestParam Long reviewerId) {
        return ResponseEntity.ok(assignmentService.getMyAssignments(reviewerId));
    }

    // API: Xem bài báo này đã gán cho ai (Chair dùng)
    // GET /api/assignments/paper/{paperId}
    @GetMapping("/paper/{paperId}")
    public ResponseEntity<?> getAssignmentsByPaper(@PathVariable Long paperId) {
        return ResponseEntity.ok(assignmentService.getAssignmentsByPaper(paperId));
    }
}