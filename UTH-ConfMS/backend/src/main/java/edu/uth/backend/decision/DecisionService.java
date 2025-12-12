package edu.uth.backend.decision;

import edu.uth.backend.entity.*;
import edu.uth.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import edu.uth.backend.notification.NotificationService;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class DecisionService {

    @Autowired private PaperRepository paperRepo;
    @Autowired private ReviewRepository reviewRepo;
    @Autowired private NotificationService notificationService;

    // 1. Hàm tính điểm trung bình (Để Chair xem trước khi quyết định)
    public double calculateAverageScore(Long paperId) {
        List<Review> reviews = reviewRepo.findByAssignment_PaperId(paperId);
        if (reviews.isEmpty()) return 0.0;

        double sum = 0;
        for (Review r : reviews) {
            sum += r.getScore();
        }
        return Math.round((sum / reviews.size()) * 100.0) / 100.0;
    }

    // 2. Hàm Ra Quyết định
    public Paper makeDecision(Long paperId, PaperStatus decision, String comment) {
        Paper paper = paperRepo.findById(paperId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài báo"));

        // Chỉ cho phép ACCEPTED hoặc REJECTED
        if (decision != PaperStatus.ACCEPTED && decision != PaperStatus.REJECTED) {
            throw new RuntimeException("Quyết định không hợp lệ! Chỉ chấp nhận ACCEPTED hoặc REJECTED.");
        }

        // Cập nhật trạng thái
        paper.setStatus(decision);
        // (Optional: Có thể lưu comment của Chair vào đâu đó nếu muốn mở rộng DB)
        Paper savedPaper = paperRepo.save(paper);
        // --- GỌI NOTIFICATION SERVICE ĐỂ GỬI MAIL ---
        notificationService.sendDecisionEmail(
                savedPaper.getMainAuthor().getEmail(),      // Email tác giả
                savedPaper.getMainAuthor().getFullName(),   // Tên tác giả
                savedPaper.getTitle(),                      // Tên bài báo
                decision                                    // Kết quả
        );
        // ---------------------------------------------
       
        return savedPaper;
    }
}