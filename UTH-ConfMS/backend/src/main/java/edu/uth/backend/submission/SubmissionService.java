package edu.uth.backend.submission;

import edu.uth.backend.common.FileStorageUtil;
import edu.uth.backend.submission.dto.CoAuthorDTO;
import edu.uth.backend.entity.*;
import edu.uth.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class SubmissionService {

    @Autowired private PaperRepository paperRepo;
    @Autowired private UserRepository userRepo;
    @Autowired private TrackRepository trackRepo;
    @Autowired private FileStorageUtil fileStorageUtil;
    
    // Repository lưu đồng tác giả
    @Autowired private PaperCoAuthorRepository coAuthorRepo; 

    public Paper submitPaper(String title, String abstractText, Long authorId, Long trackId, MultipartFile file, List<CoAuthorDTO> coAuthors) {
        
        // 1. Validate file
        if (file.isEmpty()) throw new RuntimeException("File nộp không được để trống!");
        
        // Chặn trùng bài
        boolean isDuplicate = paperRepo.existsByMainAuthorIdAndTrackIdAndTitle(authorId, trackId, title);
        if (isDuplicate) {
            throw new RuntimeException("Lỗi: Bạn đã nộp bài báo có tiêu đề này vào Track này rồi!");
        }

        // 2. Lấy dữ liệu liên quan
        User author = userRepo.findById(authorId).orElseThrow(() -> new RuntimeException("User không tồn tại"));
        Track track = trackRepo.findById(trackId).orElseThrow(() -> new RuntimeException("Track không tồn tại"));
        
        // Check Deadline
        Conference conf = track.getConference();
        if (conf.getSubmissionDeadline() != null && LocalDateTime.now().isAfter(conf.getSubmissionDeadline())) {
            throw new RuntimeException("Đã quá hạn nộp bài cho hội nghị này!");
        }

        // Lưu file
        String fileName = fileStorageUtil.saveFile(file, "submissions");

        // Lưu Paper (Cha) trước
        Paper paper = new Paper();
        paper.setTitle(title);
        paper.setAbstractText(abstractText);
        paper.setFilePath(fileName);
        paper.setMainAuthor(author);
        paper.setTrack(track);
        paper.setStatus(PaperStatus.SUBMITTED);
        
        Paper savedPaper = paperRepo.save(paper); 

        // --- LƯU ĐỒNG TÁC GIẢ (Sửa lại đoạn này cho sạch) ---
        if (coAuthors != null && !coAuthors.isEmpty()) {
            for (CoAuthorDTO dto : coAuthors) {
                PaperCoAuthor coAuthor = new PaperCoAuthor();
                coAuthor.setPaper(savedPaper); 
                coAuthor.setName(dto.getName());
                coAuthor.setEmail(dto.getEmail());
                coAuthor.setAffiliation(dto.getAffiliation());
                
                coAuthorRepo.save(coAuthor); 
            }
        }
        // ----------------------------------------

        return savedPaper;
    }
}