package edu.uth.backend.repository.conference;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import edu.uth.backend.entity.conference.Track;

import java.util.List;

@Repository
public interface TrackRepository extends JpaRepository<Track, Long> {
    
    // Lấy danh sách Track của một hội nghị cụ thể
    List<Track> findByConferenceId(Long conferenceId);
}