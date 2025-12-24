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
        try {
            return ResponseEntity.ok(discussionService.createDiscussion(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API: Lấy tất cả discussions cho một paper
    // GET /api/discussions/paper/{paperId}
    @GetMapping("/paper/{paperId}")
    public ResponseEntity<?> getDiscussionsByPaper(@PathVariable Long paperId) {
        return ResponseEntity.ok(discussionService.getDiscussionsByPaper(paperId));
    }

    // API: Lấy chỉ root discussions (không bao gồm replies)
    // GET /api/discussions/paper/{paperId}/root
    @GetMapping("/paper/{paperId}/root")
    public ResponseEntity<?> getRootDiscussions(@PathVariable Long paperId) {
        return ResponseEntity.ok(discussionService.getRootDiscussionsByPaper(paperId));
    }

    // API: Lấy replies của một discussion
    // GET /api/discussions/{parentId}/replies
    @GetMapping("/{parentId}/replies")
    public ResponseEntity<?> getReplies(@PathVariable Long parentId) {
        return ResponseEntity.ok(discussionService.getReplies(parentId));
    }

    // API: Xóa (ẩn) discussion
    // DELETE /api/discussions/{discussionId}
    @DeleteMapping("/{discussionId}")
    public ResponseEntity<?> deleteDiscussion(@PathVariable Long discussionId) {
        try {
            discussionService.deleteDiscussion(discussionId);
            return ResponseEntity.ok("Discussion đã được ẩn");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
