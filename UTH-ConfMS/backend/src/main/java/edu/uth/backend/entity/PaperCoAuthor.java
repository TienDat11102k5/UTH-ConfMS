package edu.uth.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "paper_co_authors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PaperCoAuthor extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "paper_id", nullable = false)
    private Paper paper;

    private String name;
    private String email;
    private String affiliation;

    @Column(name = "is_corresponding")
    private boolean isCorresponding = false;
}