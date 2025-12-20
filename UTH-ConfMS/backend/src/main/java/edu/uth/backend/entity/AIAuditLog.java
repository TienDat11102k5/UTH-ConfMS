package edu.uth.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

/**
 * Nhật ký kiểm toán AI
 * Lưu trữ lịch sử các yêu cầu AI để giám sát và thống kê.
 */
@Entity
@Table(name = "ai_audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "conference_id")
    private Long conferenceId;

    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false)
    private String feature;

    @Column(nullable = false)
    private String action;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String prompt;

    @Column(name = "model_id", nullable = false)
    private String modelId;

    @Column(name = "input_hash", nullable = false)
    private String inputHash;

    @Column(name = "output_summary", columnDefinition = "TEXT")
    private String outputSummary;

    private Boolean accepted;

    @Column(columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String metadata;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null)
            createdAt = LocalDateTime.now();
        if (timestamp == null)
            timestamp = LocalDateTime.now();
    }
}
