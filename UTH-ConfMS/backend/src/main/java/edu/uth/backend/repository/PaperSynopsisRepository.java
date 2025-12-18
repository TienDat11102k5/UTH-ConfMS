package edu.uth.backend.repository;

import edu.uth.backend.entity.PaperSynopsis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PaperSynopsisRepository extends JpaRepository<PaperSynopsis, Long> {
    
    Optional<PaperSynopsis> findByPaperId(Long paperId);
    
    void deleteByPaperId(Long paperId);
}


