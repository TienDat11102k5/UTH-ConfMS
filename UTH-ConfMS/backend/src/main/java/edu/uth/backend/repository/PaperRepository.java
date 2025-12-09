package edu.uth.backend.repository;

import edu.uth.backend.entity.Paper;
import edu.uth.backend.entity.PaperStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PaperRepository extends JpaRepository<Paper, Long> {

    // 1. Lấy danh sách bài của Tác giả (Trang "My Submissions")
    List<Paper> findByMainAuthorId(Long authorId);

    // 2. Lấy danh sách bài thuộc Track này (Trang quản lý của Chair)
    List<Paper> findByTrackId(Long trackId);

    // 3. Đếm số lượng bài theo trạng thái (VD: Có bao nhiêu bài đang SUBMITTED)
    long countByStatus(PaperStatus status);
    // 4. Tìm bài báo có chứa từ khóa (không phân biệt hoa thường)
    List<Paper> findByTitleContainingIgnoreCase(String keyword);
    // Hàm này kiểm tra: Có bài nào của Ông Tác Giả A, nộp vào Track B, mà Tiêu đề là C chưa?
    boolean existsByMainAuthorIdAndTrackIdAndTitle(Long authorId, Long trackId, String title);

}