package edu.uth.backend.repository;

import edu.uth.backend.entity.Track;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TrackRepository extends JpaRepository<Track, Long> {
    
    // Lấy danh sách Track của một hội nghị cụ thể
    List<Track> findByConference_Id(Long conferenceId);
}