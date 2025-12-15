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

    // ✅ Thêm Transactional để giữ kết nối DB
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

    // ✅ Thêm Transactional cho hàm này nữa (nếu bạn dùng endpoint chi tiết)
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
        if (conf.getEndDate() != null && conf.getStartDate().isAfter(conf.getEndDate())) {
            throw new RuntimeException("Ngày kết thúc phải sau ngày bắt đầu!");
        }

        // Gắn cha-con để lưu DB chuẩn
        if (conf.getTracks() != null) {
            for (Track track : conf.getTracks()) {
                track.setConference(conf);
            }
        }
        return confRepo.save(conf);
    }
}