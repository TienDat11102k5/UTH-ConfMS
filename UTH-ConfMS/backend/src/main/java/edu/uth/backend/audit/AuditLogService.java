package edu.uth.backend.audit;

import edu.uth.backend.entity.AuditLog;
import edu.uth.backend.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuditLogService {
    
    private final AuditLogRepository auditLogRepository;
    
    /**
     * Log an audit event to database
     */
    @Transactional
    public void log(String actor, String action, String target, String ipAddress, String details, Long userId) {
        AuditLog log = AuditLog.builder()
                .actor(actor)
                .action(action)
                .target(target)
                .ipAddress(ipAddress)
                .details(details)
                .userId(userId)
                .timestamp(LocalDateTime.now())
                .build();
        auditLogRepository.save(log);
    }
    
    /**
     * Get all audit logs with pagination
     */
    public Page<AuditLog> getAllLogs(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return auditLogRepository.findAllByOrderByTimestampDesc(pageable);
    }
    
    /**
     * Get audit logs with filters
     */
    public Page<AuditLog> getLogsWithFilters(String actor, String action, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        
        // Apply filters based on what's provided
        if (actor != null && !actor.isEmpty() && action != null && !action.isEmpty()) {
            return auditLogRepository.findByActorContainingIgnoreCaseAndActionOrderByTimestampDesc(
                actor, action, pageable);
        } else if (actor != null && !actor.isEmpty()) {
            return auditLogRepository.findByActorContainingIgnoreCaseOrderByTimestampDesc(
                actor, pageable);
        } else if (action != null && !action.isEmpty()) {
            return auditLogRepository.findByActionOrderByTimestampDesc(action, pageable);
        } else {
            return auditLogRepository.findAllByOrderByTimestampDesc(pageable);
        }
    }
}
