package edu.uth.backend.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Review extends BaseEntity {

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assignment_id", unique = true, nullable = false)
    @JsonIgnoreProperties({"review", "paper"})  // Prevent circular reference
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