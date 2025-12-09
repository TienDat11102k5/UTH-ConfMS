package edu.uth.backend.submission;

import edu.uth.backend.common.FileStorageUtil;
import edu.uth.backend.entity.*;
import edu.uth.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDateTime;

@Service
public class SubmissionService {
    @Autowired private PaperRepository paperRepo;
    @Autowired private UserRepository userRepo;
    @Autowired private TrackRepository trackRepo;
    @Autowired private FileStorageUtil fileStorageUtil; 

    public Paper submitPaper(String title, String abstractText, Long authorId, Long trackId, MultipartFile file) {
        // 1. Validate file
        if (file.isEmpty()) throw new RuntimeException("File nộp không được để trống!");
        
        // 2. Lấy dữ liệu liên quan
        User author = userRepo.findById(authorId)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));
        Track track = trackRepo.findById(trackId)
                .orElseThrow(() -> new RuntimeException("Track không tồn tại"));

        // 3. Check Deadline
        Conference conf = track.getConference();
        if (conf.getSubmissionDeadline() != null && LocalDateTime.now().isAfter(conf.getSubmissionDeadline())) {
            throw new RuntimeException("Đã quá hạn nộp bài cho hội nghị này!");
        }

        // 4. Lưu file vật lý
        String fileName = fileStorageUtil.saveFile(file, "submissions");

        // 5. Lưu thông tin vào Database
        Paper paper = new Paper();
        paper.setTitle(title);
        paper.setAbstractText(abstractText);
        paper.setFilePath(fileName);
        paper.setMainAuthor(author);
        paper.setTrack(track);
        paper.setStatus(PaperStatus.SUBMITTED); // Trạng thái mặc định

        return paperRepo.save(paper);
    }
}