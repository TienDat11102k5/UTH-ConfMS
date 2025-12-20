package edu.uth.backend.repository;

import edu.uth.backend.entity.AIAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AIAuditLogRepository extends JpaRepository<AIAuditLog, Long> {
    List<AIAuditLog> findByConferenceId(Long conferenceId);

    List<AIAuditLog> findByUserId(Long userId);
}
