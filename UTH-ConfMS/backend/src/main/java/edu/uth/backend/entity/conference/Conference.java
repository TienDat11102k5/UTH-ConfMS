package edu.uth.backend.entity.conference;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

import edu.uth.backend.entity.BaseEntity;
import edu.uth.backend.entity.user.User;

@Entity
@Table(name = "conferences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Conference extends BaseEntity {

    @Column(nullable = false)
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    // Người tổ chức (Chair)
    @ManyToOne
    @JoinColumn(name = "organizer_id")
    private User organizer;

    // Các mốc Deadline quan trọng
    @Column(name = "submission_deadline")
    private LocalDateTime submissionDeadline;

    @Column(name = "review_deadline")
    private LocalDateTime reviewDeadline;

    @Column(name = "camera_ready_deadline")
    private LocalDateTime cameraReadyDeadline;

    @Column(name = "is_blind_review")
    private boolean isBlindReview = false;

    // Một hội nghị có nhiều Tracks
    @OneToMany(mappedBy = "conference", cascade = CascadeType.ALL)
    private List<Track> tracks;
}