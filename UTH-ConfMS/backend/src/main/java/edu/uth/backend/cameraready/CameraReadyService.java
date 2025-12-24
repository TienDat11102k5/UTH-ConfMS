package edu.uth.backend.cameraready;

import edu.uth.backend.common.FileStorageUtil;
import edu.uth.backend.entity.*;
import edu.uth.backend.repository.PaperRepository;
import edu.uth.backend.email.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CameraReadyService {

    @Autowired
    private PaperRepository paperRepo;

    @Autowired
    private FileStorageUtil fileStorageUtil;

    @Autowired
    private EmailService emailService;

    public Paper submitCameraReady(Long paperId, MultipartFile file) {

        // 1. Tìm paper
        Paper paper = paperRepo.findById(paperId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài báo"));

        // 2. Chỉ ACCEPTED mới được nộp
        if (paper.getStatus() != PaperStatus.ACCEPTED) {
            throw new RuntimeException("Chỉ bài ACCEPTED mới được nộp camera-ready");
        }

        // 3. Check deadline
        Conference conf = paper.getTrack().getConference();
        if (conf.getCameraReadyDeadline() != null &&
                LocalDateTime.now().isAfter(conf.getCameraReadyDeadline())) {
            throw new RuntimeException("Đã quá hạn nộp camera-ready");
        }

        // 4. Validate file
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File không được để trống");
        }

        if (!file.getOriginalFilename().toLowerCase().endsWith(".pdf")) {
            throw new RuntimeException("Chỉ chấp nhận file PDF");
        }

        // 5. Cho phép nộp lại (ghi đè file cũ) - COMMENTED OUT
        // if (paper.getCameraReadyPath() != null) {
        //     throw new RuntimeException("Bài báo đã nộp camera-ready rồi");
        // }

        // 6. Lưu file
        String filePath = fileStorageUtil.saveFile(file, "camera-ready");
        System.out.println("Camera-ready file saved: " + filePath);

        // 7. Cập nhật DB
        paper.setCameraReadyPath(filePath);
        Paper savedPaper = paperRepo.save(paper);
        System.out.println("Paper updated with camera_ready_path: " + savedPaper.getCameraReadyPath());

        return savedPaper;
    }

    /**
     * Gửi email nhắc nhở cho các bài ACCEPTED chưa nộp camera-ready
     * Có thể gọi từ scheduled job hoặc manual từ Chair
     */
    public void sendCameraReadyReminders(Long conferenceId) {
        // Tìm tất cả papers ACCEPTED của conference chưa có camera-ready
        List<Paper> papers = paperRepo.findAll().stream()
                .filter(p -> p.getTrack().getConference().getId().equals(conferenceId))
                .filter(p -> p.getStatus() == PaperStatus.ACCEPTED)
                .filter(p -> p.getCameraReadyPath() == null || p.getCameraReadyPath().isEmpty())
                .toList();

        System.out.println("Sending camera-ready reminders to " + papers.size() + " authors");

        for (Paper paper : papers) {
            try {
                emailService.sendCameraReadyReminderNotification(paper);
            } catch (Exception e) {
                System.err.println("Failed to send reminder for paper " + paper.getId() + ": " + e.getMessage());
            }
        }
    }

    /**
     * Gửi reminder cho một bài cụ thể
     */
    public void sendCameraReadyReminder(Long paperId) {
        Paper paper = paperRepo.findById(paperId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài báo"));

        if (paper.getStatus() != PaperStatus.ACCEPTED) {
            throw new RuntimeException("Chỉ bài ACCEPTED mới cần nhắc nhở");
        }

        if (paper.getCameraReadyPath() != null && !paper.getCameraReadyPath().isEmpty()) {
            throw new RuntimeException("Bài báo đã nộp camera-ready rồi");
        }

        try {
            emailService.sendCameraReadyReminderNotification(paper);
        } catch (Exception e) {
            throw new RuntimeException("Không thể gửi email nhắc nhở: " + e.getMessage());
        }
    }
}
