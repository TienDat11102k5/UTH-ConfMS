package edu.uth.backend.entity.conference;

import edu.uth.backend.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tracks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Track extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "conference_id", nullable = false)
    private Conference conference;

    @Column(nullable = false)
    private String name; // Ví dụ: Công nghệ phần mềm
    
    @Column(columnDefinition = "TEXT")
    private String description;
}