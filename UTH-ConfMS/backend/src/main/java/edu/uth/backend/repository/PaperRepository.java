package edu.uth.backend.repository;

import edu.uth.backend.entity.Paper;
import edu.uth.backend.entity.PaperStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PaperRepository extends JpaRepository<Paper, Long> {

    // 1. Lấy danh sách bài của Tác giả (Trang "My Submissions")
    List<Paper> findByMainAuthorId(Long authorId);

    // 1b. Lấy danh sách bài của Tác giả, kèm coAuthors/track/conference để tránh LazyInit
    @Query("""
        select distinct p
        from Paper p
        left join fetch p.coAuthors ca
        left join fetch p.track t
        left join fetch t.conference c
        left join fetch p.mainAuthor a
        where a.id = :authorId
    """)
    List<Paper> findAllWithDetailsByAuthorId(@Param("authorId") Long authorId);

    // 1c. Lấy danh sách bài của Tác giả theo hội nghị, kèm đầy đủ quan hệ để tránh LazyInit
    @Query("""
        select distinct p
        from Paper p
        left join fetch p.coAuthors ca
        left join fetch p.track t
        left join fetch t.conference c
        left join fetch p.mainAuthor a
        where a.id = :authorId and c.id = :conferenceId
    """)
    List<Paper> findAllWithDetailsByAuthorAndConferenceId(
            @Param("authorId") Long authorId,
            @Param("conferenceId") Long conferenceId
    );

    // 2. Lấy danh sách bài thuộc Track này (Trang quản lý của Chair)
    List<Paper> findByTrackId(Long trackId);
    
    // 2b. Lấy danh sách bài thuộc Track với eager loading để tránh LazyInit
    @Query("""
        select distinct p
        from Paper p
        left join fetch p.coAuthors ca
        left join fetch p.track t
        left join fetch p.mainAuthor a
        where t.id = :trackId
    """)
    List<Paper> findAllWithDetailsByTrackId(@Param("trackId") Long trackId);

    // 3. Đếm số lượng bài theo trạng thái (VD: Có bao nhiêu bài đang SUBMITTED)
    long countByStatus(PaperStatus status);
    // 4. Tìm bài báo có chứa từ khóa (không phân biệt hoa thường)
    List<Paper> findByTitleContainingIgnoreCase(String keyword);
    // 5. Hàm này kiểm tra: Có bài nào của Ông Tác Giả A, nộp vào Track B, mà Tiêu đề là C chưa?
    boolean existsByMainAuthorIdAndTrackIdAndTitle(Long authorId, Long trackId, String title);
    // 6. Tìm bài theo Hội nghị (thông qua Track) và Trạng thái
    List<Paper> findByTrack_Conference_IdAndStatus(Long conferenceId, PaperStatus status);

    // 7. Lấy bài theo hội nghị và trạng thái với eager loading (cho Proceedings)
    @Query("""
        select distinct p
        from Paper p
        left join fetch p.coAuthors ca
        left join fetch p.track t
        left join fetch t.conference c
        left join fetch p.mainAuthor a
        where c.id = :conferenceId and p.status = :status
    """)
    List<Paper> findAllWithDetailsByConferenceIdAndStatus(
            @Param("conferenceId") Long conferenceId,
            @Param("status") PaperStatus status
    );

    // 8. Lấy tất cả bài theo trạng thái với eager loading (cho All Proceedings)
    @Query("""
        select distinct p
        from Paper p
        left join fetch p.coAuthors ca
        left join fetch p.track t
        left join fetch t.conference c
        left join fetch p.mainAuthor a
        where p.status = :status
    """)
    List<Paper> findAllWithDetailsByStatus(@Param("status") PaperStatus status);

}