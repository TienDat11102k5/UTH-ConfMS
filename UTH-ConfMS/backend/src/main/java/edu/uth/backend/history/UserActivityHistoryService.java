package edu.uth.backend.history;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.uth.backend.entity.*;
import edu.uth.backend.repository.UserActivityHistoryRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Service quản lý lịch sử hoạt động người dùng
 */
@Service
@Slf4j
public class UserActivityHistoryService {

    @Autowired
    private UserActivityHistoryRepository historyRepository;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Ghi lại một hoạt động của người dùng
     */
    @Transactional
    public UserActivityHistory logActivity(
            Long userId,
            ActivityType activityType,
            EntityType entityType,
            Long entityId,
            String description,
            Map<String, Object> metadata,
            String ipAddress) {
        try {
            String metadataJson = null;
            if (metadata != null && !metadata.isEmpty()) {
                metadataJson = objectMapper.writeValueAsString(metadata);
            }

            UserActivityHistory history = UserActivityHistory.builder()
                    .userId(userId)
                    .activityType(activityType)
                    .entityType(entityType)
                    .entityId(entityId)
                    .description(description)
                    .metadata(metadataJson)
                    .ipAddress(ipAddress)
                    .timestamp(LocalDateTime.now())
                    .status(ActivityStatus.SUCCESS)
                    .build();

            UserActivityHistory saved = historyRepository.save(history);
            log.info("Logged activity: userId={}, type={}, description={}",
                    userId, activityType, description);
            return saved;

        } catch (JsonProcessingException e) {
            log.error("Error converting metadata to JSON", e);
            throw new RuntimeException("Failed to log activity", e);
        }
    }

    /**
     * Ghi lại hoạt động với trạng thái thất bại
     */
    @Transactional
    public UserActivityHistory logFailedActivity(
            Long userId,
            ActivityType activityType,
            EntityType entityType,
            Long entityId,
            String description,
            Map<String, Object> metadata,
            String ipAddress) {
        try {
            String metadataJson = null;
            if (metadata != null && !metadata.isEmpty()) {
                metadataJson = objectMapper.writeValueAsString(metadata);
            }

            UserActivityHistory history = UserActivityHistory.builder()
                    .userId(userId)
                    .activityType(activityType)
                    .entityType(entityType)
                    .entityId(entityId)
                    .description(description)
                    .metadata(metadataJson)
                    .ipAddress(ipAddress)
                    .timestamp(LocalDateTime.now())
                    .status(ActivityStatus.FAILED)
                    .build();

            return historyRepository.save(history);

        } catch (JsonProcessingException e) {
            log.error("Error converting metadata to JSON", e);
            throw new RuntimeException("Failed to log activity", e);
        }
    }

    /**
     * Lấy tất cả lịch sử của user
     */
    public List<UserActivityHistory> getUserHistory(Long userId) {
        return historyRepository.findByUserIdOrderByTimestampDesc(userId);
    }

    /**
     * Lấy lịch sử với phân trang
     */
    public Page<UserActivityHistory> getUserHistory(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return historyRepository.findByUserIdOrderByTimestampDesc(userId, pageable);
    }

    /**
     * Lọc theo loại hoạt động
     */
    public List<UserActivityHistory> getUserHistoryByType(Long userId, ActivityType activityType) {
        return historyRepository.findByUserIdAndActivityTypeOrderByTimestampDesc(userId, activityType);
    }

    /**
     * Lọc theo nhiều loại hoạt động (nhóm)
     */
    public List<UserActivityHistory> getUserHistoryByTypes(Long userId, List<ActivityType> activityTypes) {
        return historyRepository.findByUserIdAndActivityTypeInOrderByTimestampDesc(userId, activityTypes);
    }

    /**
     * Lọc theo khoảng thời gian
     */
    public List<UserActivityHistory> getUserHistoryByDateRange(
            Long userId,
            LocalDateTime startTime,
            LocalDateTime endTime) {
        return historyRepository.findByUserIdAndTimestampBetweenOrderByTimestampDesc(
                userId, startTime, endTime);
    }

    /**
     * Lọc theo khoảng thời gian với phân trang
     */
    public Page<UserActivityHistory> getUserHistoryByDateRange(
            Long userId,
            LocalDateTime startTime,
            LocalDateTime endTime,
            int page,
            int size) {
        Pageable pageable = PageRequest.of(page, size);
        return historyRepository.findByUserIdAndTimestampBetweenOrderByTimestampDesc(
                userId, startTime, endTime, pageable);
    }

    /**
     * Lọc kết hợp: loại hoạt động và khoảng thời gian
     */
    public List<UserActivityHistory> getUserHistoryByTypesAndDateRange(
            Long userId,
            List<ActivityType> activityTypes,
            LocalDateTime startTime,
            LocalDateTime endTime) {
        return historyRepository.findByUserIdAndActivityTypesAndTimeRange(
                userId, activityTypes, startTime, endTime);
    }

    /**
     * Lấy lịch sử theo entity cụ thể (ví dụ: tất cả hoạt động liên quan đến paper
     * ID 123)
     */
    public List<UserActivityHistory> getUserHistoryByEntity(Long userId, Long entityId) {
        return historyRepository.findByUserIdAndEntityIdOrderByTimestampDesc(userId, entityId);
    }

    /**
     * Đếm tổng số hoạt động của user
     */
    public long countUserActivities(Long userId) {
        return historyRepository.countByUserId(userId);
    }

    /**
     * Đếm số hoạt động theo loại
     */
    public long countUserActivitiesByType(Long userId, ActivityType activityType) {
        return historyRepository.countByUserIdAndActivityType(userId, activityType);
    }

    /**
     * Lấy nhóm hoạt động Paper (Submit, Edit, Withdraw, Upload Camera Ready)
     */
    public List<UserActivityHistory> getPaperActivities(Long userId) {
        List<ActivityType> paperTypes = Arrays.asList(
                ActivityType.SUBMIT_PAPER,
                ActivityType.EDIT_PAPER,
                ActivityType.WITHDRAW_PAPER,
                ActivityType.UPLOAD_CAMERA_READY);
        return getUserHistoryByTypes(userId, paperTypes);
    }

    /**
     * Lấy nhóm hoạt động Review
     */
    public List<UserActivityHistory> getReviewActivities(Long userId) {
        List<ActivityType> reviewTypes = Arrays.asList(
                ActivityType.VIEW_REVIEW,
                ActivityType.SUBMIT_REVIEW,
                ActivityType.UPDATE_REVIEW);
        return getUserHistoryByTypes(userId, reviewTypes);
    }

    /**
     * Lấy nhóm hoạt động Auth/System
     */
    public List<UserActivityHistory> getAuthActivities(Long userId) {
        List<ActivityType> authTypes = Arrays.asList(
                ActivityType.LOGIN,
                ActivityType.LOGOUT,
                ActivityType.UPDATE_PROFILE,
                ActivityType.CHANGE_PASSWORD);
        return getUserHistoryByTypes(userId, authTypes);
    }

    /**
     * Helper: Tạo metadata map cho paper activities
     */
    public Map<String, Object> createPaperMetadata(String paperTitle, String conferenceName, Long conferenceId) {
        Map<String, Object> metadata = new HashMap<>();
        if (paperTitle != null)
            metadata.put("paperTitle", paperTitle);
        if (conferenceName != null)
            metadata.put("conferenceName", conferenceName);
        if (conferenceId != null)
            metadata.put("conferenceId", conferenceId);
        return metadata;
    }

    /**
     * Helper: Tạo metadata map cho login
     */
    public Map<String, Object> createLoginMetadata(String userAgent, String location) {
        Map<String, Object> metadata = new HashMap<>();
        if (userAgent != null)
            metadata.put("userAgent", userAgent);
        if (location != null)
            metadata.put("location", location);
        return metadata;
    }
}
