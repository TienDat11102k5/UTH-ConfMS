package edu.uth.backend.decision;

import edu.uth.backend.decision.dto.DecisionRequestDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/decisions")
@CrossOrigin(origins = "*")
public class DecisionController {

    @Autowired
    private DecisionService decisionService;

    // API: Xem điểm trung bình của bài báo (Chair tham khảo)
    // GET /api/decisions/score/{paperId}
    @GetMapping("/score/{paperId}")
    public ResponseEntity<?> getAverageScore(@PathVariable Long paperId) {
        return ResponseEntity.ok(decisionService.calculateAverageScore(paperId));
    }

    // API: Ra quyết định (Accept/Reject)
    // POST /api/decisions
    @PostMapping
    public ResponseEntity<?> makeDecision(@RequestBody DecisionRequestDTO req) {
        try {
            return ResponseEntity.ok(decisionService.makeDecision(req.getPaperId(), req.getStatus(), req.getComment()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}