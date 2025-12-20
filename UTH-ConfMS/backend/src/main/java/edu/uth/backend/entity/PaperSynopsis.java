package edu.uth.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

/**
 * Thực thể Tóm tắt Bài Báo
 * Lưu các tóm tắt do AI sinh để tránh gọi API thừa.
 */
@Entity
@Table(name = "paper_synopses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PaperSynopsis extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "paper_id", nullable = false, unique = true)
    private Paper paper;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String synopsis;

    @Column(name = "key_themes", columnDefinition = "TEXT")
    private String keyThemes; // Mảng JSON dưới dạng chuỗi

    @Column(name = "claims", columnDefinition = "TEXT")
    private String claims; // Mảng JSON

    @Column(name = "datasets", columnDefinition = "TEXT")
    private String datasets; // Mảng JSON

    @Column(name = "methodology", length = 100)
    private String methodology;

    @Column(name = "contribution_type", length = 200)
    private String contributionType;

    @Column(name = "word_count")
    private Integer wordCount;

    @Column(name = "length", length = 20)
    private String length; // "short", "medium", "long"

    @Column(name = "language", length = 10)
    private String language = "vi";

    @Column(name = "model_used", length = 50)
    private String modelUsed = "gemini-1.5-flash";

    @Column(name = "generated_at")
    private LocalDateTime generatedAt;

    @Column(name = "is_validated")
    private Boolean isValidated = false; // Trạng thái xác thực double-blind

    @Column(name = "validation_issues", columnDefinition = "TEXT")
    private String validationIssues; // Mảng JSON các vấn đề (nếu có)
}
