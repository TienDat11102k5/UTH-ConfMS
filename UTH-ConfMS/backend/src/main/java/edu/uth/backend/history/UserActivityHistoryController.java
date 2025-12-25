package edu.uth.backend.history;

import edu.uth.backend.entity.ActivityType;
import edu.uth.backend.entity.User;
import edu.uth.backend.entity.UserActivityHistory;
import edu.uth.backend.exception.ResourceNotFoundException;
import edu.uth.backend.repository.UserRepository;
import edu.uth.backend.history.dto.UserActivityHistoryDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * REST API Controller cho lịch sử hoạt động người dùng
 */
@RestController
@RequestMapping("/api/history")
@CrossOrigin(origins = "*")
public class UserActivityHistoryController {

    @Autowired
    private UserActivityHistoryService historyService;

    @Autowired
    private UserRepository userRepository;

    /**
     * Lấy tất cả lịch sử của user hiện tại
     * GET /api/history/my-activities
     */
    @GetMapping("/my-activities")
    public ResponseEntity<?> getMyActivities(
            Authentication authentication,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        Long userId = getCurrentUserId(authentication);

        if (page != null && size != null) {
            // Với phân trang
            Page<UserActivityHistory> historyPage = historyService.getUserHistory(userId, page, size);
            Page<UserActivityHistoryDTO> dtoPage = historyPage.map(this::convertToDTO);
            return ResponseEntity.ok(dtoPage);
        } else {
            // Không phân trang
            List<UserActivityHistory> histories = historyService.getUserHistory(userId);
            List<UserActivityHistoryDTO> dtos = histories.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        }
    }

    /**
     * Lọc theo loại hoạt động
     * GET /api/history/my-activities/by-type?type=SUBMIT_PAPER
     */
    @GetMapping("/my-activities/by-type")
    public ResponseEntity<?> getMyActivitiesByType(
            Authentication authentication,
            @RequestParam ActivityType type) {
        Long userId = getCurrentUserId(authentication);
        List<UserActivityHistory> histories = historyService.getUserHistoryByType(userId, type);
        List<UserActivityHistoryDTO> dtos = histories.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    /**
     * Lọc theo nhóm hoạt động (paper, review, auth)
     * GET /api/history/my-activities/by-group?group=paper
     */
    @GetMapping("/my-activities/by-group")
    public ResponseEntity<?> getMyActivitiesByGroup(
            Authentication authentication,
            @RequestParam String group) {
        Long userId = getCurrentUserId(authentication);
        List<UserActivityHistory> histories;

        switch (group.toLowerCase()) {
            case "paper":
                histories = historyService.getPaperActivities(userId);
                break;
            case "review":
                histories = historyService.getReviewActivities(userId);
                break;
            case "auth":
            case "system":
                histories = historyService.getAuthActivities(userId);
                break;
            default:
                return ResponseEntity.badRequest().body("Invalid group: " + group);
        }

        List<UserActivityHistoryDTO> dtos = histories.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    /**
     * Lọc theo khoảng thời gian
     * GET
     * /api/history/my-activities/by-date?from=2025-01-01T00:00:00&to=2025-12-31T23:59:59
     */
    @GetMapping("/my-activities/by-date")
    public ResponseEntity<?> getMyActivitiesByDateRange(
            Authentication authentication,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        Long userId = getCurrentUserId(authentication);

        if (page != null && size != null) {
            Page<UserActivityHistory> historyPage = historyService.getUserHistoryByDateRange(
                    userId, from, to, page, size);
            Page<UserActivityHistoryDTO> dtoPage = historyPage.map(this::convertToDTO);
            return ResponseEntity.ok(dtoPage);
        } else {
            List<UserActivityHistory> histories = historyService.getUserHistoryByDateRange(userId, from, to);
            List<UserActivityHistoryDTO> dtos = histories.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        }
    }

    /**
     * Lấy lịch sử theo preset time range (today, week, month)
     * GET /api/history/my-activities/recent?range=today
     */
    @GetMapping("/my-activities/recent")
    public ResponseEntity<?> getRecentActivities(
            Authentication authentication,
            @RequestParam(defaultValue = "week") String range) {
        Long userId = getCurrentUserId(authentication);
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startTime;

        switch (range.toLowerCase()) {
            case "today":
                startTime = now.toLocalDate().atStartOfDay();
                break;
            case "week":
                startTime = now.minusWeeks(1);
                break;
            case "month":
                startTime = now.minusMonths(1);
                break;
            default:
                return ResponseEntity.badRequest().body("Invalid range: " + range);
        }

        List<UserActivityHistory> histories = historyService.getUserHistoryByDateRange(
                userId, startTime, now);
        List<UserActivityHistoryDTO> dtos = histories.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    /**
     * Lấy lịch sử liên quan đến một entity cụ thể (ví dụ: paper)
     * GET /api/history/my-activities/by-entity?entityId=123
     */
    @GetMapping("/my-activities/by-entity")
    public ResponseEntity<?> getMyActivitiesByEntity(
            Authentication authentication,
            @RequestParam Long entityId) {
        Long userId = getCurrentUserId(authentication);
        List<UserActivityHistory> histories = historyService.getUserHistoryByEntity(userId, entityId);
        List<UserActivityHistoryDTO> dtos = histories.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    /**
     * Lấy thống kê số lượng hoạt động
     * GET /api/history/my-activities/stats
     */
    @GetMapping("/my-activities/stats")
    public ResponseEntity<?> getActivityStats(Authentication authentication) {
        Long userId = getCurrentUserId(authentication);

        long totalActivities = historyService.countUserActivities(userId);
        long paperActivities = historyService.countUserActivitiesByType(userId, ActivityType.SUBMIT_PAPER)
                + historyService.countUserActivitiesByType(userId, ActivityType.EDIT_PAPER)
                + historyService.countUserActivitiesByType(userId, ActivityType.WITHDRAW_PAPER)
                + historyService.countUserActivitiesByType(userId, ActivityType.UPLOAD_CAMERA_READY);
        long reviewActivities = historyService.countUserActivitiesByType(userId, ActivityType.VIEW_REVIEW)
                + historyService.countUserActivitiesByType(userId, ActivityType.SUBMIT_REVIEW)
                + historyService.countUserActivitiesByType(userId, ActivityType.UPDATE_REVIEW);
        long loginCount = historyService.countUserActivitiesByType(userId, ActivityType.LOGIN);

        return ResponseEntity.ok(new ActivityStats(totalActivities, paperActivities, reviewActivities, loginCount));
    }

    // Helper methods

    private Long getCurrentUserId(Authentication authentication) {
        if (authentication == null) {
            throw new IllegalArgumentException("Vui lòng đăng nhập!");
        }

        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        return user.getId();
    }

    private UserActivityHistoryDTO convertToDTO(UserActivityHistory history) {
        return UserActivityHistoryDTO.builder()
                .id(history.getId())
                .userId(history.getUserId())
                .activityType(history.getActivityType())
                .activityTypeName(history.getActivityType().getDisplayName())
                .entityType(history.getEntityType())
                .entityTypeName(history.getEntityType().getDisplayName())
                .entityId(history.getEntityId())
                .description(history.getDescription())
                .metadata(history.getMetadata())
                .timestamp(history.getTimestamp())
                .status(history.getStatus())
                .statusName(history.getStatus().getDisplayName())
                .ipAddress(history.getIpAddress())
                .createdAt(history.getCreatedAt())
                .build();
    }

    // Inner class for stats response
    @lombok.Data
    @lombok.AllArgsConstructor
    static class ActivityStats {
        private long totalActivities;
        private long paperActivities;
        private long reviewActivities;
        private long loginCount;
    }
}
