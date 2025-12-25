package edu.uth.backend.discussion;

import edu.uth.backend.discussion.dto.DiscussionRequestDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/discussions")
@CrossOrigin(origins = "*")
public class DiscussionController {

    @Autowired
    private DiscussionService discussionService;

    // API: Tạo discussion mới
    // POST /api/discussions
    @PostMapping
    public ResponseEntity<?> createDiscussion(@RequestBody DiscussionRequestDTO request) {
        log.info("Create discussion request - paperId={}", request.getPaperId());
        try {
            var result = discussionService.createDiscussion(request);
            log.info("Create discussion success - discussionId={}", result.getId());
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            log.error("Create discussion failed - reason={}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API: Lấy tất cả discussions cho một paper
    // GET /api/discussions/paper/{paperId}
    @GetMapping("/paper/{paperId}")
    public ResponseEntity<?> getDiscussionsByPaper(@PathVariable Long paperId) {
        log.info("Get discussions by paper - paperId={}", paperId);
        return ResponseEntity.ok(discussionService.getDiscussionsByPaper(paperId));
    }

    // API: Lấy chỉ root discussions (không bao gồm replies)
    // GET /api/discussions/paper/{paperId}/root
    @GetMapping("/paper/{paperId}/root")
    public ResponseEntity<?> getRootDiscussions(@PathVariable Long paperId) {
        log.info("Get root discussions - paperId={}", paperId);
        return ResponseEntity.ok(discussionService.getRootDiscussionsByPaper(paperId));
    }

    // API: Lấy replies của một discussion
    // GET /api/discussions/{parentId}/replies
    @GetMapping("/{parentId}/replies")
    public ResponseEntity<?> getReplies(@PathVariable Long parentId) {
        log.info("Get replies - parentDiscussionId={}", parentId);
        return ResponseEntity.ok(discussionService.getReplies(parentId));
    }

    // API: Xóa (ẩn) discussion
    // DELETE /api/discussions/{discussionId}
    @DeleteMapping("/{discussionId}")
    public ResponseEntity<?> deleteDiscussion(@PathVariable Long discussionId) {
        log.info("Delete discussion request - discussionId={}", discussionId);
        try {
            discussionService.deleteDiscussion(discussionId);
            log.info("Delete discussion success - discussionId={}", discussionId);
            return ResponseEntity.ok("Discussion đã được ẩn");
        } catch (RuntimeException e) {
            log.error("Delete discussion failed - discussionId={}, reason={}", discussionId, e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
