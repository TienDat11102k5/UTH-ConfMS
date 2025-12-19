package edu.uth.backend.conference;

import edu.uth.backend.entity.Conference;
import edu.uth.backend.entity.Track;
import edu.uth.backend.repository.ConferenceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class ConferenceService {
    @Autowired private ConferenceRepository confRepo;

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
        return confRepo.save(conf);
    }

    @Transactional
    public Conference updateConference(Long id, Conference incoming) {
        Conference existing = confRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hội nghị"));

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
        if (!confRepo.existsById(id)) {
            throw new RuntimeException("Không tìm thấy hội nghị");
        }
        confRepo.deleteById(id);
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