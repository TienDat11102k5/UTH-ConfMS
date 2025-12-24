package edu.uth.backend.submission;

import edu.uth.backend.entity.Paper;
import edu.uth.backend.repository.PaperRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/papers")
@CrossOrigin(origins = "*")
public class PaperController {

    @Autowired
    private PaperRepository paperRepository;

    // API: Lấy tất cả papers
    // GET /api/papers
    @GetMapping
    public ResponseEntity<List<Paper>> getAllPapers() {
        List<Paper> papers = paperRepository.findAll();
        return ResponseEntity.ok(papers);
    }

    // API: Lấy paper theo ID
    // GET /api/papers/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getPaperById(@PathVariable Long id) {
        return paperRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    // API: Lấy papers theo track
    // GET /api/papers/track/{trackId}
    @GetMapping("/track/{trackId}")
    public ResponseEntity<List<Paper>> getPapersByTrack(@PathVariable Long trackId) {
        List<Paper> papers = paperRepository.findByTrackId(trackId);
        return ResponseEntity.ok(papers);
    }
}
