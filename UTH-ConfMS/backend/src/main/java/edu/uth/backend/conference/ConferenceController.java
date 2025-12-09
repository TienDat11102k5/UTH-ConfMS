package edu.uth.backend.conference;

import edu.uth.backend.entity.Conference;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/conferences")
@CrossOrigin(origins = "*")
public class ConferenceController {

    @Autowired
    private ConferenceService conferenceService;

    // API: Lấy danh sách tất cả hội nghị
    // GET: /api/conferences
    @GetMapping
    public ResponseEntity<List<Conference>> getAllConferences() {
        return ResponseEntity.ok(conferenceService.getAllConferences());
    }

    // API: Lấy chi tiết 1 hội nghị
    // GET: /api/conferences/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getConferenceById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(conferenceService.getConferenceById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    // API: Tạo hội nghị mới
    // POST: /api/conferences
    @PostMapping
    public ResponseEntity<?> createConference(@RequestBody Conference conference) {
        try {
            return ResponseEntity.ok(conferenceService.createConference(conference));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
