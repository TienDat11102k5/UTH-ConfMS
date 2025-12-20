package edu.uth.backend.repository;

import edu.uth.backend.entity.ReviewAssignment;
import edu.uth.backend.entity.AssignmentStatus; 
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReviewAssignmentRepository extends JpaRepository<ReviewAssignment, Long> {
    
    // 1. Lấy danh sách bài ĐƯỢC MỜI chấm của một Reviewer 
    List<ReviewAssignment> findByReviewerId(Long reviewerId);

    // 2. Xem bài báo này đã phân công cho ai rồi (Chair xem) 
    List<ReviewAssignment> findByPaperId(Long paperId);

    // 3. Kiểm tra xem ông này đã được mời chấm bài này chưa (Tránh mời trùng)
    boolean existsByPaperIdAndReviewerId(Long paperId, Long reviewerId);

    // 3b. Kiểm tra theo thứ tự ngược (cho discussions)
    boolean existsByReviewerIdAndPaperId(Long reviewerId, Long paperId);

    // 4. (Optional) Tìm theo trạng thái
    List<ReviewAssignment> findByPaperIdAndStatus(Long paperId, AssignmentStatus status);
}