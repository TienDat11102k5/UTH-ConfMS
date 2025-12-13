package edu.uth.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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