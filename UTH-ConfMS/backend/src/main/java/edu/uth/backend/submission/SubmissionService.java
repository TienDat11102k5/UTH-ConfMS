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
    @Autowired private PaperCoAuthorRepository coAuthorRepo;

    private static final long MAX_FILE_SIZE = 25L * 1024 * 1024; // 25MB

    private void validatePdf(MultipartFile file) {
        if (file == null) throw new RuntimeException("File không được để trống");
        if (file.getSize() > MAX_FILE_SIZE) throw new RuntimeException("Kích thước file vượt quá 25MB");
        String ct = file.getContentType();
        String name = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        if (ct == null || (!ct.toLowerCase().contains("pdf") && !name.endsWith(".pdf"))) {
            throw new RuntimeException("Chỉ chấp nhận file PDF");
        }
    }

    // --- 1. NỘP BÀI ---
    public Paper submitPaper(String title, String abstractText, Long authorId, Long trackId, MultipartFile file, List<CoAuthorDTO> coAuthors) {
        if (file.isEmpty()) throw new RuntimeException("File nộp không được để trống!");
        validatePdf(file);
        
        boolean isDuplicate = paperRepo.existsByMainAuthorIdAndTrackIdAndTitle(authorId, trackId, title);
        if (isDuplicate) throw new RuntimeException("Lỗi: Bạn đã nộp bài báo có tiêu đề này vào Track này rồi!");

        User author = userRepo.findById(authorId).orElseThrow(() -> new RuntimeException("User không tồn tại"));
        Track track = trackRepo.findById(trackId).orElseThrow(() -> new RuntimeException("Track không tồn tại"));
        
        Conference conf = track.getConference();
        if (conf.getSubmissionDeadline() != null && LocalDateTime.now().isAfter(conf.getSubmissionDeadline())) {
            throw new RuntimeException("Đã quá hạn nộp bài cho hội nghị này!");
        }

        String fileName = fileStorageUtil.saveFile(file, "submissions");

        Paper paper = new Paper();
        paper.setTitle(title);
        paper.setAbstractText(abstractText);
        paper.setFilePath(fileName);
        paper.setMainAuthor(author);
        paper.setTrack(track);
        paper.setStatus(PaperStatus.SUBMITTED);
        
        Paper savedPaper = paperRepo.save(paper);

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
        return savedPaper;
    }

    // --- 2. XEM DANH SÁCH BÀI CỦA TÁC GIẢ ---
    public List<Paper> getPapersByAuthor(Long authorId) {
        return paperRepo.findByMainAuthorId(authorId);
    }

    // --- 3. XEM CHI TIẾT 1 BÀI ---
    public Paper getPaperById(Long paperId) {
        return paperRepo.findById(paperId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài báo với ID: " + paperId));
    }

    // --- 4. SỬA BÀI (EDIT) - Đã thêm check User ---
    public Paper updatePaper(Long paperId, String newTitle, String newAbstract, MultipartFile newFile, Long currentUserId) {
        Paper paper = getPaperById(paperId);

        // Security Check: Chỉ tác giả chính mới được sửa
        if (!paper.getMainAuthor().getId().equals(currentUserId)) {
            throw new RuntimeException("Bạn không có quyền chỉnh sửa bài báo này!");
        }

        if (paper.getStatus() != PaperStatus.SUBMITTED) {
            throw new RuntimeException("Không thể sửa bài khi đã vào quy trình chấm hoặc đã có kết quả!");
        }

        Conference conf = paper.getTrack().getConference();
        if (conf.getSubmissionDeadline() != null && LocalDateTime.now().isAfter(conf.getSubmissionDeadline())) {
            throw new RuntimeException("Đã hết hạn nộp bài, không thể chỉnh sửa!");
        }

        if (newTitle != null && !newTitle.isBlank()) paper.setTitle(newTitle);
        if (newAbstract != null && !newAbstract.isBlank()) paper.setAbstractText(newAbstract);

        if (newFile != null && !newFile.isEmpty()) {
            validatePdf(newFile);
            String old = paper.getFilePath();
            String fileName = fileStorageUtil.saveFile(newFile, "submissions");
            paper.setFilePath(fileName);
            // Delete old file if exists
            try { fileStorageUtil.deleteFile(old, "submissions"); } catch (Exception ignored) {}
        }

        return paperRepo.save(paper);
    }

    // --- 5. RÚT BÀI (WITHDRAW) - Đã thêm check User ---
    public Paper withdrawPaper(Long paperId, Long currentUserId) {
        Paper paper = getPaperById(paperId);

        // Security Check
        if (!paper.getMainAuthor().getId().equals(currentUserId)) {
            throw new RuntimeException("Bạn không có quyền rút bài báo này!");
        }

        if (paper.getStatus() == PaperStatus.ACCEPTED || paper.getStatus() == PaperStatus.REJECTED) {
            throw new RuntimeException("Bài báo đã có kết quả quyết định, không thể rút!");
        }

        paper.setStatus(PaperStatus.WITHDRAWN);
        return paperRepo.save(paper);
    }
}