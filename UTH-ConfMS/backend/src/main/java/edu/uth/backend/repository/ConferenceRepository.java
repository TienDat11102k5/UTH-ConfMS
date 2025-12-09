package edu.uth.backend.repository;

import edu.uth.backend.entity.Conference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ConferenceRepository extends JpaRepository<Conference, Long> {
    
    // Lấy các hội nghị do một người (Chair) tổ chức
    List<Conference> findByOrganizerId(Long organizerId);
    
    // Tìm hội nghị đang mở (ngày hiện tại nằm giữa start và end) 

    //tìm kiếm hội nghị theo tên (không phân biệt hoa thường)
    List<Conference> findByNameContainingIgnoreCase(String name);
}