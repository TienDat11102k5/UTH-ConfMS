package edu.uth.backend.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tracks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Track extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "conference_id", nullable = false)
    @JsonIgnore
    private Conference conference;

    @Column(nullable = false)
    private String name; 
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    // Thông tin cho Program/Schedule
    @Column(name = "session_date")
    private String sessionDate; // VD: "2025-01-15" hoặc "Ngày 15/01/2025"
    
    @Column(name = "session_time")
    private String sessionTime; // VD: "09:00 - 11:00"
    
    @Column(name = "room")
    private String room; // VD: "Phòng 201", "Hội trường A"
    
    // Expose conferenceId for AI feature governance without exposing full conference object
    @JsonProperty("conferenceId")
    public Long getConferenceId() {
        return conference != null ? conference.getId() : null;
    }
}