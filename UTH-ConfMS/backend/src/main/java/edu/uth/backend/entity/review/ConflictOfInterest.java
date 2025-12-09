package edu.uth.backend.entity.review;

import edu.uth.backend.entity.BaseEntity;
import edu.uth.backend.entity.Paper;
import edu.uth.backend.entity.user.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "conflicts_of_interest")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ConflictOfInterest extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "paper_id")
    private Paper paper;

    @ManyToOne
    @JoinColumn(name = "reviewer_id")
    private User reviewer;

    @Column(columnDefinition = "TEXT")
    private String reason; // Lý do xung đột (VD: Cùng cơ quan)
}