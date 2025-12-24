package edu.uth.backend.conference;
import lombok.extern.slf4j.Slf4j;
import edu.uth.backend.entity.Conference;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
@Slf4j
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
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_CHAIR')")
    @PostMapping
    public ResponseEntity<?> createConference(@RequestBody Conference conference) {
        try {
            return ResponseEntity.ok(conferenceService.createConference(conference));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API: Cập nhật hội nghị
    // PUT: /api/conferences/{id}
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_CHAIR')")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateConference(@PathVariable Long id, @RequestBody Conference conference) {
        try {
            return ResponseEntity.ok(conferenceService.updateConference(id, conference));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API: Xóa hội nghị
    // DELETE: /api/conferences/{id}
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_CHAIR')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteConference(@PathVariable Long id) {
        try {
            conferenceService.deleteConference(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
