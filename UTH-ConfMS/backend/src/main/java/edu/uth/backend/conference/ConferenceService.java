package edu.uth.backend.conference;

import edu.uth.backend.entity.Conference;
import edu.uth.backend.entity.Track;
import edu.uth.backend.repository.ConferenceRepository;
import edu.uth.backend.security.AuditLogger;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.List;

@Service
public class ConferenceService {
    @Autowired private ConferenceRepository confRepo;
    @Autowired private AuditLogger auditLogger;
    
    private String getClientIp() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                String xForwardedFor = request.getHeader("X-Forwarded-For");
                if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                    return xForwardedFor.split(",")[0].trim();
                }
                return request.getRemoteAddr();
            }
        } catch (Exception e) {
            // Ignore
        }
        return "unknown";
    }
    
    private String getCurrentUsername() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()) {
                return auth.getName();
            }
        } catch (Exception e) {
            // Ignore
        }
        return "system";
    }

    // Thêm Transactional để giữ kết nối DB
    @Transactional(readOnly = true)
    public List<Conference> getAllConferences() {
        List<Conference> list = confRepo.findAll();
        // "Đánh thức" danh sách tracks trước khi đóng session
        if (list != null) {
            for (Conference c : list) {
                if (c.getTracks() != null) {
                    c.getTracks().size(); // Hibernate sẽ query lấy tracks ngay tại đây
                }
            }
        }
        // Filter out hidden conferences for non-admin users
        // Note: Filtering is done in controller based on user role
        return list;
    }

    //  Thêm Transactional cho hàm này nữa (nếu bạn dùng endpoint chi tiết)
    @Transactional(readOnly = true)
    public Conference getConferenceById(Long id) {
        Conference conf = confRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hội nghị"));
        
        // "Đánh thức" tracks
        if (conf.getTracks() != null) {
            conf.getTracks().size();
        }
        return conf;
    }

    @Transactional
    public Conference createConference(Conference conf) {
        validateConference(conf);
        attachTracks(conf);
        Conference saved = confRepo.save(conf);
        
        // Audit log
        auditLogger.logConferenceCreation(saved.getName(), getCurrentUsername(), getClientIp());
        
        return saved;
    }

    @Transactional
    public Conference updateConference(Long id, Conference incoming) {
        Conference existing = confRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hội nghị"));

        // Check if conference is locked (only admin can edit locked conferences)
        if (existing.getIsLocked() != null && existing.getIsLocked()) {
            throw new RuntimeException("Hội nghị đã bị khóa, không thể chỉnh sửa");
        }

        // Áp dụng các trường được phép cập nhật
        existing.setName(incoming.getName());
        existing.setDescription(incoming.getDescription());
        existing.setStartDate(incoming.getStartDate());
        existing.setEndDate(incoming.getEndDate());
        existing.setSubmissionDeadline(incoming.getSubmissionDeadline());
        existing.setReviewDeadline(incoming.getReviewDeadline());
        existing.setCameraReadyDeadline(incoming.getCameraReadyDeadline());
        existing.setBlindReview(incoming.isBlindReview());

        // Tracks (nếu gửi kèm)
        existing.setTracks(incoming.getTracks());
        attachTracks(existing);

        validateConference(existing);
        return confRepo.save(existing);
    }

    @Transactional
    public void deleteConference(Long id) {
        Conference existing = confRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hội nghị"));
        
        // Check if conference is locked
        if (existing.getIsLocked() != null && existing.getIsLocked()) {
            throw new RuntimeException("Hội nghị đã bị khóa, không thể xóa");
        }
        
        // Audit log before delete
        auditLogger.logConferenceDeletion(existing.getName(), getCurrentUsername(), getClientIp());
        
        confRepo.deleteById(id);
    }

    @Transactional
    public Conference toggleHidden(Long id) {
        Conference conf = confRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hội nghị"));
        
        // Check if conference is locked
        if (conf.getIsLocked() != null && conf.getIsLocked()) {
            throw new RuntimeException("Hội nghị đã bị khóa, không thể thay đổi trạng thái hiển thị");
        }
        
        // Eager load tracks to avoid LazyInitializationException
        if (conf.getTracks() != null) {
            conf.getTracks().size();
        }
        
        // Toggle hidden status
        Boolean currentStatus = conf.getIsHidden();
        conf.setIsHidden(currentStatus == null || !currentStatus);
        
        return confRepo.save(conf);
    }

    @Transactional
    public Conference toggleLocked(Long id) {
        Conference conf = confRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hội nghị"));
        
        // Eager load tracks to avoid LazyInitializationException
        if (conf.getTracks() != null) {
            conf.getTracks().size();
        }
        
        // Toggle locked status
        Boolean currentStatus = conf.getIsLocked();
        conf.setIsLocked(currentStatus == null || !currentStatus);
        
        return confRepo.save(conf);
    }

    private void validateConference(Conference conf) {
        if (conf.getName() == null || conf.getName().isBlank()) {
            throw new RuntimeException("Tên hội nghị là bắt buộc");
        }
        if (conf.getDescription() == null || conf.getDescription().isBlank()) {
            throw new RuntimeException("Mô tả hội nghị là bắt buộc");
        }
        if (conf.getStartDate() == null || conf.getEndDate() == null) {
            throw new RuntimeException("Ngày bắt đầu và ngày kết thúc là bắt buộc");
        }
        if (conf.getStartDate().isAfter(conf.getEndDate())) {
            throw new RuntimeException("Ngày kết thúc phải sau ngày bắt đầu");
        }
        if (conf.getSubmissionDeadline() != null && conf.getStartDate() != null
                && conf.getSubmissionDeadline().isAfter(conf.getStartDate())) {
            throw new RuntimeException("Hạn nộp bài phải trước hoặc bằng ngày bắt đầu hội nghị");
        }
    }

    private void attachTracks(Conference conf) {
        if (conf.getTracks() != null) {
            for (Track track : conf.getTracks()) {
                track.setConference(conf);
            }
        }
    }
}