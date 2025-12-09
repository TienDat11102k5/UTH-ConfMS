package edu.uth.backend.conference;

import edu.uth.backend.entity.Conference;
import edu.uth.backend.entity.Track;
import edu.uth.backend.repository.ConferenceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ConferenceService {
    @Autowired private ConferenceRepository confRepo;

    public List<Conference> getAllConferences() {
        return confRepo.findAll();
    }

    public Conference createConference(Conference conf) {
        // 1. Validate ngày tháng
        if (conf.getEndDate() != null && conf.getStartDate().isAfter(conf.getEndDate())) {
            throw new RuntimeException("Ngày kết thúc phải sau ngày bắt đầu!");
        }

        // 2. GẮN KẾT CHA - CON (Đây là đoạn code quan trọng nhất để sửa lỗi)
        // Nếu danh sách Track không rỗng, ta phải điền tên Conference vào cho từng Track
        if (conf.getTracks() != null) {
            for (Track track : conf.getTracks()) {
                track.setConference(conf); // Gán: Track này thuộc về Hội nghị này
            }
        }

        // 3. Lưu xuống Database (Lúc này Track đã có conference_id nên không bị lỗi nữa)
        return confRepo.save(conf);
    }

    public Conference getConferenceById(Long id) {
        return confRepo.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy hội nghị"));
    }
}