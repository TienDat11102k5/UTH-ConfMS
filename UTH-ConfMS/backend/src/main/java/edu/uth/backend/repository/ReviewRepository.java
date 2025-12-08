package edu.uth.backend.repository;

import edu.uth.backend.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    // Tìm kết quả review dựa trên ID phân công
    Optional<Review> findByAssignmentId(Long assignmentId);

    // Lấy tất cả bài review của một bài báo (Để tính điểm trung bình)
    // Lưu ý: Đi qua object Assignment -> Paper
    List<Review> findByAssignment_PaperId(Long paperId);
}