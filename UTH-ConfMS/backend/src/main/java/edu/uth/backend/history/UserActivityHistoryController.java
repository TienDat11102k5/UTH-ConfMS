package edu.uth.backend.history;

import edu.uth.backend.entity.ActivityType;
import edu.uth.backend.entity.User;
import edu.uth.backend.entity.UserActivityHistory;
import edu.uth.backend.exception.ResourceNotFoundException;
import edu.uth.backend.repository.UserRepository;
import edu.uth.backend.history.dto.UserActivityHistoryDTO;
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
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
        log.info("Get my activities - userId={}, page={}, size={}", userId, page, size);

        if (page != null && size != null) {
            Page<UserActivityHistory> historyPage = historyService.getUserHistory(userId, page, size);
            Page<UserActivityHistoryDTO> dtoPage = historyPage.map(this::convertToDTO);
            return ResponseEntity.ok(dtoPage);
        } else {
            List<UserActivityHistory> histories = historyService.getUserHistory(userId);
            List<UserActivityHistoryDTO> dtos = histories.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        }
    }

    /**
     * Lọc theo loại hoạt động
     */
    @GetMapping("/my-activities/by-type")
    public ResponseEntity<?> getMyActivitiesByType(
            Authentication authentication,
            @RequestParam ActivityType type) {

        Long userId = getCurrentUserId(authentication);
        log.info("Get activities by type - userId={}, type={}", userId, type);

        List<UserActivityHistory> histories = historyService.getUserHistoryByType(userId, type);
        List<UserActivityHistoryDTO> dtos = histories.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    /**
     * Lọc theo nhóm hoạt động
     */
    @GetMapping("/my-activities/by-group")
    public ResponseEntity<?> getMyActivitiesByGroup(
            Authentication authentication,
            @RequestParam String group) {

        Long userId = getCurrentUserId(authentication);
        log.info("Get activities by group - userId={}, group={}", userId, group);

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
                log.warn("Invalid activity group - userId={}, group={}", userId, group);
                return ResponseEntity.badRequest().body("Invalid group: " + group);
        }

        List<UserActivityHistoryDTO> dtos = histories.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    /**
     * Lọc theo khoảng thời gian
     */
    @GetMapping("/my-activities/by-date")
    public ResponseEntity<?> getMyActivitiesByDateRange(
            Authentication authentication,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        Long userId = getCurrentUserId(authentication);
        log.info("Get activities by date range - userId={}, from={}, to={}", userId, from, to);

        if (page != null && size != null) {
            Page<UserActivityHistory> historyPage =
                    historyService.getUserHistoryByDateRange(userId, from, to, page, size);
            Page<UserActivityHistoryDTO> dtoPage = historyPage.map(this::convertToDTO);
            return ResponseEntity.ok(dtoPage);
        } else {
            List<UserActivityHistory> histories =
                    historyService.getUserHistoryByDateRange(userId, from, to);
            List<UserActivityHistoryDTO> dtos = histories.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        }
    }

    /**
     * Preset time range
     */
    @GetMapping("/my-activities/recent")
    public ResponseEntity<?> getRecentActivities(
            Authentication authentication,
            @RequestParam(defaultValue = "week") String range) {

        Long userId = getCurrentUserId(authentication);
        log.info("Get recent activities - userId={}, range={}", userId, range);

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
                log.warn("Invalid recent range - userId={}, range={}", userId, range);
                return ResponseEntity.badRequest().body("Invalid range: " + range);
        }

        List<UserActivityHistory> histories =
                historyService.getUserHistoryByDateRange(userId, startTime, now);
        List<UserActivityHistoryDTO> dtos = histories.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    /**
     * Theo entity
     */
    @GetMapping("/my-activities/by-entity")
    public ResponseEntity<?> getMyActivitiesByEntity(
            Authentication authentication,
            @RequestParam Long entityId) {

        Long userId = getCurrentUserId(authentication);
        log.info("Get activities by entity - userId={}, entityId={}", userId, entityId);

        List<UserActivityHistory> histories =
                historyService.getUserHistoryByEntity(userId, entityId);
        List<UserActivityHistoryDTO> dtos = histories.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    /**
     * Thống kê
     */
    @GetMapping("/my-activities/stats")
    public ResponseEntity<?> getActivityStats(Authentication authentication) {

        Long userId = getCurrentUserId(authentication);
        log.info("Get activity stats - userId={}", userId);

        long totalActivities = historyService.countUserActivities(userId);
        long paperActivities =
                historyService.countUserActivitiesByType(userId, ActivityType.SUBMIT_PAPER)
                        + historyService.countUserActivitiesByType(userId, ActivityType.EDIT_PAPER)
                        + historyService.countUserActivitiesByType(userId, ActivityType.WITHDRAW_PAPER)
                        + historyService.countUserActivitiesByType(userId, ActivityType.UPLOAD_CAMERA_READY);
        long reviewActivities =
                historyService.countUserActivitiesByType(userId, ActivityType.VIEW_REVIEW)
                        + historyService.countUserActivitiesByType(userId, ActivityType.SUBMIT_REVIEW)
                        + historyService.countUserActivitiesByType(userId, ActivityType.UPDATE_REVIEW);
        long loginCount =
                historyService.countUserActivitiesByType(userId, ActivityType.LOGIN);

        return ResponseEntity.ok(
                new ActivityStats(totalActivities, paperActivities, reviewActivities, loginCount));
    }

    // ================= Helper =================

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

    @lombok.Data
    @lombok.AllArgsConstructor
    static class ActivityStats {
        private long totalActivities;
        private long paperActivities;
        private long reviewActivities;
        private long loginCount;
    }
}
