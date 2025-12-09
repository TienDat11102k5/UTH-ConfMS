package edu.uth.backend.entity.review;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

import edu.uth.backend.entity.AssignmentStatus;
import edu.uth.backend.entity.BaseEntity;
import edu.uth.backend.entity.Paper;
import edu.uth.backend.entity.user.User;

@Entity
@Table(name = "review_assignments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReviewAssignment extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "paper_id", nullable = false)
    private Paper paper;

    @ManyToOne
    @JoinColumn(name = "reviewer_id", nullable = false)
    private User reviewer;

    @Enumerated(EnumType.STRING)
    private AssignmentStatus status = AssignmentStatus.PENDING;

    @Column(name = "assigned_date")
    private LocalDateTime assignedDate;

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    // Map 1-1 với kết quả Review (Nếu đã chấm xong)
    @OneToOne(mappedBy = "assignment", cascade = CascadeType.ALL)
    private Review review;
}