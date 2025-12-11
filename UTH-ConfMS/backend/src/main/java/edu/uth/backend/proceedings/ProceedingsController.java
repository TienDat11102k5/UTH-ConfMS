package edu.uth.backend.proceedings;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/proceedings")
@CrossOrigin(origins = "*")
public class ProceedingsController {

    @Autowired
    private ProceedingsService proceedingsService;

    // API: Lấy danh sách kỷ yếu (Public)
    // GET /api/proceedings/{conferenceId}
    @GetMapping("/{conferenceId}")
    public ResponseEntity<?> getProceedings(@PathVariable Long conferenceId) {
        return ResponseEntity.ok(proceedingsService.getConferenceProceedings(conferenceId));
    }
}