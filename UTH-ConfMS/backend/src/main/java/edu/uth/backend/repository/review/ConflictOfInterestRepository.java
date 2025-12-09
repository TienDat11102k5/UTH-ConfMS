package edu.uth.backend.repository.review;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import edu.uth.backend.entity.review.ConflictOfInterest;

import java.util.List;

@Repository
public interface ConflictOfInterestRepository extends JpaRepository<ConflictOfInterest, Long> {

    // Lấy danh sách COI của một bài báo (Để Chair biết đường tránh)
    List<ConflictOfInterest> findByPaperId(Long paperId);

    // Kiểm tra nhanh xem 2 người này có bị xung đột với bài này không
    boolean existsByPaperIdAndReviewerId(Long paperId, Long reviewerId);
}