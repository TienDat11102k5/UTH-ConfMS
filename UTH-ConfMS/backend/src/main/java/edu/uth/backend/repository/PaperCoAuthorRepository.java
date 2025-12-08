package edu.uth.backend.repository;

import edu.uth.backend.entity.PaperCoAuthor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PaperCoAuthorRepository extends JpaRepository<PaperCoAuthor, Long> {
    // Lấy danh sách đồng tác giả của 1 bài báo
    List<PaperCoAuthor> findByPaperId(Long paperId);
}