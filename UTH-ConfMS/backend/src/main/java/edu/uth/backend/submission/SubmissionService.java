package edu.uth.backend.submission;

import edu.uth.backend.common.FileStorageUtil;
import edu.uth.backend.common.FileValidationService;
import edu.uth.backend.exception.ResourceNotFoundException;
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

    @Autowired
    private PaperRepository paperRepo;
    @Autowired
    private UserRepository userRepo;
    @Autowired
    private TrackRepository trackRepo;
    @Autowired
    private ConferenceRepository conferenceRepo;
    @Autowired
    private FileStorageUtil fileStorageUtil;
    @Autowired
    private FileValidationService fileValidationService;
    @Autowired
    private PaperCoAuthorRepository coAuthorRepo;

    // --- 1. NỘP BÀI ---
    @org.springframework.transaction.annotation.Transactional
    public Paper submitPaper(String title, String abstractText, Long authorId, Long trackId, MultipartFile file,
            List<CoAuthorDTO> coAuthors) {
        // Validate file with comprehensive checks
        fileValidationService.validatePdfFile(file);

        boolean isDuplicate = paperRepo.existsByMainAuthorIdAndTrackIdAndTitle(authorId, trackId, title);
        if (isDuplicate)
            throw new IllegalArgumentException("Bạn đã nộp bài báo có tiêu đề này vào Track này rồi!");

        User author = userRepo.findById(authorId)
                .orElseThrow(() -> new ResourceNotFoundException("User", authorId));
        Track track = trackRepo.findById(trackId)
                .orElseThrow(() -> new ResourceNotFoundException("Track", trackId));

        Conference conf = track.getConference();
        if (conf.getSubmissionDeadline() != null && LocalDateTime.now().isAfter(conf.getSubmissionDeadline())) {
            throw new IllegalArgumentException("Đã quá hạn nộp bài cho hội nghị này!");
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
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<Paper> getPapersByAuthor(Long authorId) {
        return paperRepo.findAllWithDetailsByAuthorId(authorId);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<Paper> getPapersByAuthorAndConference(Long authorId, Long conferenceId) {
        return paperRepo.findAllWithDetailsByAuthorAndConferenceId(authorId, conferenceId);
    }

    // --- 2.1. (MỚI) LẤY DANH SÁCH BÀI CỦA HỘI NGHỊ (Dành cho Chair) ---
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<Paper> getPapersByConference(Long conferenceId) {
        Conference conference = conferenceRepo.findById(conferenceId)
                .orElseThrow(() -> new ResourceNotFoundException("Conference", conferenceId));
        List<Track> tracks = conference.getTracks();
        java.util.List<Paper> papers = new java.util.ArrayList<>();
        for (Track track : tracks) {
            // Use eager loading query to avoid LazyInitializationException
            papers.addAll(paperRepo.findAllWithDetailsByTrackId(track.getId()));
        }
        return papers;
    }

    // --- 3. XEM CHI TIẾT 1 BÀI ---
    public Paper getPaperById(Long paperId) {
        return paperRepo.findById(paperId)
                .orElseThrow(() -> new ResourceNotFoundException("Paper", paperId));
    }

    // --- 4. SỬA BÀI (EDIT) - Đã thêm check User ---
    public Paper updatePaper(Long paperId, String newTitle, String newAbstract, MultipartFile newFile,
            Long currentUserId) {
        Paper paper = getPaperById(paperId);

        // Kiểm tra bảo mật: chỉ tác giả chính mới được sửa
        if (!paper.getMainAuthor().getId().equals(currentUserId)) {
            throw new IllegalArgumentException("Bạn không có quyền chỉnh sửa bài báo này!");
        }

        if (paper.getStatus() != PaperStatus.SUBMITTED) {
            throw new IllegalArgumentException("Không thể sửa bài khi đã vào quy trình chấm hoặc đã có kết quả!");
        }

        Conference conf = paper.getTrack().getConference();
        if (conf.getSubmissionDeadline() != null && LocalDateTime.now().isAfter(conf.getSubmissionDeadline())) {
            throw new IllegalArgumentException("Đã hết hạn nộp bài, không thể chỉnh sửa!");
        }

        if (newTitle != null && !newTitle.isBlank())
            paper.setTitle(newTitle);
        if (newAbstract != null && !newAbstract.isBlank())
            paper.setAbstractText(newAbstract);

        if (newFile != null && !newFile.isEmpty()) {
            fileValidationService.validatePdfFile(newFile);
            String old = paper.getFilePath();
            String fileName = fileStorageUtil.saveFile(newFile, "submissions");
            paper.setFilePath(fileName);
            // Xóa file cũ nếu tồn tại
            try {
                fileStorageUtil.deleteFile(old, "submissions");
            } catch (Exception ignored) {
            }
        }

        return paperRepo.save(paper);
    }

    // Tách hàm cập nhật Abstract riêng cho AI apply
    public Paper updatePaperAbstract(Long paperId, String newAbstract, Long currentUserId) {
        Paper paper = getPaperById(paperId);

        if (!paper.getMainAuthor().getId().equals(currentUserId)) {
            throw new IllegalArgumentException("Bạn không có quyền chỉnh sửa bài báo này!");
        }
        if (paper.getStatus() != PaperStatus.SUBMITTED) {
            throw new IllegalArgumentException("Không thể sửa bài khi đã vào quy trình chấm!");
        }

        paper.setAbstractText(newAbstract);
        return paperRepo.save(paper);
    }

    // --- 5. RÚT BÀI (WITHDRAW) - Đã thêm check User ---
    public Paper withdrawPaper(Long paperId, Long currentUserId) {
        Paper paper = getPaperById(paperId);

        // Security Check
        if (!paper.getMainAuthor().getId().equals(currentUserId)) {
            throw new IllegalArgumentException("Bạn không có quyền rút bài báo này!");
        }

        if (paper.getStatus() == PaperStatus.ACCEPTED || paper.getStatus() == PaperStatus.REJECTED) {
            throw new IllegalArgumentException("Bài báo đã có kết quả quyết định, không thể rút!");
        }

        paper.setStatus(PaperStatus.WITHDRAWN);
        return paperRepo.save(paper);
    }

    // --- 6. LẤY DANH SÁCH REVIEWER (Dành cho Chair phân công) ---
    public List<User> getAllReviewers() {
        return userRepo.findAllReviewers();
    }
}