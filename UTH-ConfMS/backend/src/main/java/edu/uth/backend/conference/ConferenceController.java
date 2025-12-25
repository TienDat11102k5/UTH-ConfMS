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
public class ConferenceController {

    @Autowired
    private ConferenceService conferenceService;

    // GET /api/conferences
    @GetMapping
    public ResponseEntity<List<Conference>> getAllConferences() {
        log.info("GET /api/conferences");

        List<Conference> conferences = conferenceService.getAllConferences();
        log.info("Fetched conferences | count={}", conferences.size());

        return ResponseEntity.ok(conferences);
    }

    // GET /api/conferences/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getConferenceById(@PathVariable Long id) {
        log.info("GET /api/conferences/{}", id);

        try {
            Conference conference = conferenceService.getConferenceById(id);
            log.info("Fetched conference | id={}", id);
            return ResponseEntity.ok(conference);
        } catch (RuntimeException e) {
            log.error("Error fetching conference | id={}", id, e);
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // POST /api/conferences
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_CHAIR')")
    @PostMapping
    public ResponseEntity<?> createConference(@RequestBody Conference conference) {
        log.info("POST /api/conferences | name={}", conference.getName());

        try {
            Conference created = conferenceService.createConference(conference);
            log.info("Conference created | id={}", created.getId());
            return ResponseEntity.ok(created);
        } catch (RuntimeException e) {
            log.error("Error creating conference | name={}", conference.getName(), e);
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // PUT /api/conferences/{id}
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_CHAIR')")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateConference(
            @PathVariable Long id,
            @RequestBody Conference conference) {

        log.info("PUT /api/conferences/{} | name={}", id, conference.getName());

        try {
            Conference updated = conferenceService.updateConference(id, conference);
            log.info("Conference updated | id={}", id);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            log.error("Error updating conference | id={}", id, e);
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // DELETE /api/conferences/{id}
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_CHAIR')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteConference(@PathVariable Long id) {
        log.info("DELETE /api/conferences/{}", id);

        try {
            conferenceService.deleteConference(id);
            log.info("Conference deleted | id={}", id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Error deleting conference | id={}", id, e);
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
