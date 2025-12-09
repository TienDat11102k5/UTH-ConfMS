package edu.uth.backend.repository.review;

import edu.uth.backend.entity.AssignmentStatus;
import edu.uth.backend.entity.review.ReviewAssignment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReviewAssignmentRepository extends JpaRepository<ReviewAssignment, Long> {

    // 1. Lấy danh sách bài ĐƯỢC MỜI chấm của một Reviewer (Trang "My Reviews")
    List<ReviewAssignment> findByReviewerId(Long reviewerId);

    // 2. Xem bài báo này đã phân công cho ai rồi (Chair xem)
    List<ReviewAssignment> findByPaperId(Long paperId);

    // 3. Kiểm tra xem ông này đã được mời chấm bài này chưa (Tránh mời trùng)
    boolean existsByPaperIdAndReviewerId(Long paperId, Long reviewerId);
    
    // 4. Lấy các assignment theo trạng thái (VD: Tìm các ông chưa trả lời PENDING)
    List<ReviewAssignment> findByPaperIdAndStatus(Long paperId, AssignmentStatus status);
}