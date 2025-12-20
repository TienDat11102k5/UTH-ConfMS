package edu.uth.backend.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Cờ tính năng AI
 * Cho phép bật/tắt các tính năng AI cụ thể cho từng hội nghị.
 */
@Entity
@Table(name = "ai_feature_flags", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "conference_id", "feature_name" })
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIFeatureFlag extends BaseEntity {

    @Column(name = "conference_id", nullable = false)
    private Long conferenceId;

    @Column(name = "feature_name", nullable = false)
    private String featureName;

    @Column(nullable = false)
    private boolean enabled;
}
