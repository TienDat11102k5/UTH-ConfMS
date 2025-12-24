package edu.uth.backend.assignment;
import lombok.extern.slf4j.Slf4j;
import edu.uth.backend.entity.ConflictOfInterest;
import edu.uth.backend.entity.Paper;
import edu.uth.backend.entity.User;
import edu.uth.backend.repository.ConflictOfInterestRepository;
import edu.uth.backend.repository.PaperRepository;
import edu.uth.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@Slf4j
@RestController
@RequestMapping("/api/conflicts")
@CrossOrigin(origins = "*")
public class ConflictController {

    @Autowired private ConflictOfInterestRepository coiRepo;
    @Autowired private UserRepository userRepo;
    @Autowired private PaperRepository paperRepo;

    // API: Reviewer tự khai báo xung đột
    // POST /api/conflicts?reviewerId=2&paperId=1&reason=DongNghiep
    @PostMapping
    public ResponseEntity<?> declareConflict(
            @RequestParam Long reviewerId,
            @RequestParam Long paperId,
            @RequestParam String reason
    ) {
        try {
            // 1. Kiểm tra tồn tại
            User reviewer = userRepo.findById(reviewerId)
                    .orElseThrow(() -> new RuntimeException("Reviewer không tồn tại"));
            Paper paper = paperRepo.findById(paperId)
                    .orElseThrow(() -> new RuntimeException("Bài báo không tồn tại"));

            // 2. Kiểm tra xem đã khai báo trước đó chưa (tránh spam)
            if (coiRepo.existsByPaperIdAndReviewerId(paperId, reviewerId)) {
                return ResponseEntity.badRequest().body("Bạn đã khai báo xung đột với bài này rồi!");
            }

            // 3. Lưu luôn (Không cần qua Service cho đỡ dài dòng)
            ConflictOfInterest coi = new ConflictOfInterest();
            coi.setReviewer(reviewer);
            coi.setPaper(paper);
            coi.setReason(reason);
          

            return ResponseEntity.ok(coiRepo.save(coi));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API: Lấy danh sách COI của một reviewer
    // GET /api/conflicts/reviewer/{reviewerId}
    @GetMapping("/reviewer/{reviewerId}")
    public ResponseEntity<?> getReviewerConflicts(@PathVariable Long reviewerId) {
        try {
            List<ConflictOfInterest> conflicts = coiRepo.findByReviewerId(reviewerId);
            return ResponseEntity.ok(conflicts);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API: Xóa COI
    // DELETE /api/conflicts/{coiId}
    @DeleteMapping("/{coiId}")
    public ResponseEntity<?> deleteConflict(@PathVariable Long coiId) {
        try {
            if (!coiRepo.existsById(coiId)) {
                return ResponseEntity.badRequest().body("Không tìm thấy COI này!");
            }
            coiRepo.deleteById(coiId);
            return ResponseEntity.ok("Đã xóa COI thành công");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}