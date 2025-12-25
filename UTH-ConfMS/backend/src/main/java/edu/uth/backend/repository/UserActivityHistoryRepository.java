package edu.uth.backend.repository;

import edu.uth.backend.entity.ActivityType;
import edu.uth.backend.entity.UserActivityHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface UserActivityHistoryRepository extends JpaRepository<UserActivityHistory, Long> {

    /**
     * Lấy tất cả hoạt động của user, sắp xếp theo thời gian mới nhất
     */
    List<UserActivityHistory> findByUserIdOrderByTimestampDesc(Long userId);

    /**
     * Lấy hoạt động của user với phân trang
     */
    Page<UserActivityHistory> findByUserIdOrderByTimestampDesc(Long userId, Pageable pageable);

    /**
     * Lọc theo loại hoạt động
     */
    List<UserActivityHistory> findByUserIdAndActivityTypeOrderByTimestampDesc(
            Long userId,
            ActivityType activityType);

    /**
     * Lọc theo nhiều loại hoạt động
     */
    List<UserActivityHistory> findByUserIdAndActivityTypeInOrderByTimestampDesc(
            Long userId,
            List<ActivityType> activityTypes);

    /**
     * Lọc theo khoảng thời gian
     */
    List<UserActivityHistory> findByUserIdAndTimestampBetweenOrderByTimestampDesc(
            Long userId,
            LocalDateTime startTime,
            LocalDateTime endTime);

    /**
     * Lọc theo khoảng thời gian với phân trang
     */
    Page<UserActivityHistory> findByUserIdAndTimestampBetweenOrderByTimestampDesc(
            Long userId,
            LocalDateTime startTime,
            LocalDateTime endTime,
            Pageable pageable);

    /**
     * Lọc kết hợp: loại hoạt động và khoảng thời gian
     */
    @Query("SELECT h FROM UserActivityHistory h WHERE h.userId = :userId " +
            "AND h.activityType IN :activityTypes " +
            "AND h.timestamp BETWEEN :startTime AND :endTime " +
            "ORDER BY h.timestamp DESC")
    List<UserActivityHistory> findByUserIdAndActivityTypesAndTimeRange(
            @Param("userId") Long userId,
            @Param("activityTypes") List<ActivityType> activityTypes,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    /**
     * Đếm số hoạt động của user
     */
    long countByUserId(Long userId);

    /**
     * Đếm số hoạt động theo loại
     */
    long countByUserIdAndActivityType(Long userId, ActivityType activityType);

    /**
     * Lấy hoạt động liên quan đến một entity cụ thể
     */
    List<UserActivityHistory> findByUserIdAndEntityIdOrderByTimestampDesc(
            Long userId,
            Long entityId);
}
