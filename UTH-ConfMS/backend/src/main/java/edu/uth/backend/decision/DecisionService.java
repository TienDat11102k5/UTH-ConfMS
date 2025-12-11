package edu.uth.backend.decision;

import edu.uth.backend.entity.*;
import edu.uth.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class DecisionService {

    @Autowired private PaperRepository paperRepo;
    @Autowired private ReviewRepository reviewRepo;

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

        // --- MOCK GỬI EMAIL THÔNG BÁO ---
        System.out.println(">>> [EMAIL] Gửi tới tác giả: " + savedPaper.getMainAuthor().getEmail());
        System.out.println(">>> Tiêu đề: Thông báo kết quả bài báo " + savedPaper.getTitle());
        System.out.println(">>> Nội dung: Bài báo của bạn đã được " + decision);
        return savedPaper;
    }
}