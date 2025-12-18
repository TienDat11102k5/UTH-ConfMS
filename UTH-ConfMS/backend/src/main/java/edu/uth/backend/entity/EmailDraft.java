package edu.uth.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

/**
 * Thực thể Bản Nháp Email
 * Lưu các bản nháp email do AI sinh để Chair xem xét và phê duyệt.
 */
@Entity
@Table(name = "email_drafts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmailDraft extends BaseEntity {

    @Column(name = "conference_id", nullable = false)
    private Long conferenceId;

    @Enumerated(EnumType.STRING)
    @Column(name = "email_type", nullable = false)
    private EmailType emailType;

    @Column(name = "recipient_id")
    private Long recipientId; // ID tác giả hoặc ID reviewer

    @Column(nullable = false)
    private String subject;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String body;

    @Column(name = "template_type")
    private String templateType;

    @Column(columnDefinition = "TEXT")
    private String personalization; // Chuỗi JSON

    @Column(name = "generated_at")
    private LocalDateTime generatedAt;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private DraftStatus status = DraftStatus.DRAFT;

    @Column(name = "approved_by")
    private Long approvedBy; // ID người dùng của Chair đã phê duyệt

    @Column(name = "edited_subject", columnDefinition = "TEXT")
    private String editedSubject; // Phiên bản tiêu đề do Chair chỉnh sửa

    @Column(name = "edited_body", columnDefinition = "TEXT")
    private String editedBody; // Phiên bản nội dung do Chair chỉnh sửa

    @Column(name = "paper_id")
    private Long paperId; // Dùng cho email thông báo quyết định

    public enum EmailType {
        ACCEPT_NOTIFICATION,
        REJECT_NOTIFICATION,
        REVIEWER_REMINDER,
        REVIEWER_INVITATION
    }

    public enum DraftStatus {
        DRAFT,
        APPROVED,
        SENT,
        CANCELLED
    }
}


