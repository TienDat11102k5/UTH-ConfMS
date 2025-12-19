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

    // API: Reviewer chấp nhận assignment
    // PUT /api/assignments/{assignmentId}/accept
    @PutMapping("/{assignmentId}/accept")
    public ResponseEntity<?> acceptAssignment(@PathVariable Long assignmentId) {
        try {
            return ResponseEntity.ok(assignmentService.acceptAssignment(assignmentId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API: Reviewer từ chối assignment
    // PUT /api/assignments/{assignmentId}/decline
    @PutMapping("/{assignmentId}/decline")
    public ResponseEntity<?> declineAssignment(@PathVariable Long assignmentId) {
        try {
            return ResponseEntity.ok(assignmentService.declineAssignment(assignmentId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API: Bulk assignment
    // POST /api/assignments/bulk
    @PostMapping("/bulk")
    public ResponseEntity<?> bulkAssign(@RequestBody java.util.Map<String, java.util.List<Long>> request) {
        try {
            java.util.List<Long> paperIds = request.get("paperIds");
            java.util.List<Long> reviewerIds = request.get("reviewerIds");
            if (paperIds == null || reviewerIds == null) {
                return ResponseEntity.badRequest().body("paperIds và reviewerIds là bắt buộc");
            }
            return ResponseEntity.ok(assignmentService.bulkAssign(paperIds, reviewerIds));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API: Lấy assignment theo ID
    // GET /api/assignments/{assignmentId}
    @GetMapping("/{assignmentId}")
    public ResponseEntity<?> getAssignmentById(@PathVariable Long assignmentId) {
        try {
            return ResponseEntity.ok(assignmentService.getAssignmentById(assignmentId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}