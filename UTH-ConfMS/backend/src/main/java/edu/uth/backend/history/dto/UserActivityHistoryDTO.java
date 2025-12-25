package edu.uth.backend.history.dto;

import edu.uth.backend.entity.ActivityStatus;
import edu.uth.backend.entity.ActivityType;
import edu.uth.backend.entity.EntityType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO cho response lịch sử hoạt động
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserActivityHistoryDTO {
    private Long id;
    private Long userId;
    private ActivityType activityType;
    private String activityTypeName;
    private EntityType entityType;
    private String entityTypeName;
    private Long entityId;
    private String description;
    private String metadata;
    private LocalDateTime timestamp;
    private ActivityStatus status;
    private String statusName;
    private String ipAddress;
    private LocalDateTime createdAt;
}
