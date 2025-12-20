package edu.uth.backend.repository;

import edu.uth.backend.entity.Discussion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DiscussionRepository extends JpaRepository<Discussion, Long> {
    
    // Lấy tất cả discussions cho một paper (chỉ comment gốc, không bao gồm replies)
    @Query("SELECT d FROM Discussion d WHERE d.paper.id = :paperId AND d.parent IS NULL AND d.isVisible = true ORDER BY d.createdAt DESC")
    List<Discussion> findByPaperIdRootComments(Long paperId);
    
    // Lấy tất cả discussions cho một paper (bao gồm cả replies)
    @Query("SELECT d FROM Discussion d WHERE d.paper.id = :paperId AND d.isVisible = true ORDER BY d.createdAt ASC")
    List<Discussion> findByPaperIdAllComments(Long paperId);
    
    // Lấy tất cả replies cho một comment
    @Query("SELECT d FROM Discussion d WHERE d.parent.id = :parentId AND d.isVisible = true ORDER BY d.createdAt ASC")
    List<Discussion> findRepliesByParentId(Long parentId);
}
