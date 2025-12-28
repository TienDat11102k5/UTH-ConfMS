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
    public ResponseEntity<List<Conference>> getAllConferences(
            org.springframework.security.core.Authentication authentication) {
        log.info("GET /api/conferences");

        List<Conference> conferences = conferenceService.getAllConferences();
        
        // Filter hidden conferences for non-admin/non-chair users
        boolean isAdminOrChair = authentication != null && 
            authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") 
                    || a.getAuthority().equals("ROLE_CHAIR")
                    || a.getAuthority().equals("ROLE_TRACK_CHAIR"));
        
        if (!isAdminOrChair) {
            conferences = conferences.stream()
                .filter(c -> c.getIsHidden() == null || !c.getIsHidden())
                .collect(java.util.stream.Collectors.toList());
        }
        
        log.info("Fetched conferences | count={} | isAdminOrChair={}", conferences.size(), isAdminOrChair);

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

    // PUT /api/conferences/{id}/toggle-hidden
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_CHAIR','ROLE_TRACK_CHAIR')")
    @PutMapping("/{id}/toggle-hidden")
    public ResponseEntity<?> toggleHidden(@PathVariable Long id) {
        log.info("PUT /api/conferences/{}/toggle-hidden", id);

        try {
            Conference updated = conferenceService.toggleHidden(id);
            log.info("Conference hidden status toggled | id={} | isHidden={}", id, updated.getIsHidden());
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            log.error("Error toggling conference hidden status | id={}", id, e);
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // PUT /api/conferences/{id}/toggle-locked (ADMIN only)
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @PutMapping("/{id}/toggle-locked")
    public ResponseEntity<?> toggleLocked(@PathVariable Long id) {
        log.info("PUT /api/conferences/{}/toggle-locked", id);

        try {
            Conference updated = conferenceService.toggleLocked(id);
            log.info("Conference locked status toggled | id={} | isLocked={}", id, updated.getIsLocked());
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            log.error("Error toggling conference locked status | id={}", id, e);
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
