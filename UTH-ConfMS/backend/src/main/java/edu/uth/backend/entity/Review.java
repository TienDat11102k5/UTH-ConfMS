package edu.uth.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Review extends BaseEntity {

    @OneToOne
    @JoinColumn(name = "assignment_id", unique = true, nullable = false)
    private ReviewAssignment assignment;

    private Integer score; 
    
    @Column(name = "confidence_level")
    private Integer confidenceLevel; // 1 đến 5

    @Column(name = "comment_for_author", columnDefinition = "TEXT")
    private String commentForAuthor;

    @Column(name = "comment_for_pc", columnDefinition = "TEXT")
    private String commentForPC;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;
}