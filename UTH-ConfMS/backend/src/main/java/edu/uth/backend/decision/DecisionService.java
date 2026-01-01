package edu.uth.backend.decision;

import edu.uth.backend.entity.*;
import edu.uth.backend.repository.*;
import edu.uth.backend.email.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import edu.uth.backend.notification.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@Transactional
public class DecisionService {

    @Autowired private PaperRepository paperRepo;
    @Autowired private ReviewRepository reviewRepo;
    @Autowired private NotificationService notificationService;
    @Autowired private EmailService emailService;

    // 1. Hàm tính điểm trung bình (Để Chair xem trước khi quyết định)
    @Transactional(readOnly = true)
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
        return makeDecision(paperId, decision, comment, false);
    }
    
    // Overload với skipEmail parameter
    public Paper makeDecision(Long paperId, PaperStatus decision, String comment, boolean skipEmail) {
        Paper paper = paperRepo.findById(paperId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài báo"));

        // Check if conference is locked
        if (paper.getTrack() != null && paper.getTrack().getConference() != null) {
            Conference conference = paper.getTrack().getConference();
            if (conference.getIsLocked() != null && conference.getIsLocked()) {
                throw new RuntimeException("Hội nghị đã bị khóa, không thể ra quyết định!");
            }
        }

        // Chỉ cho phép ACCEPTED hoặc REJECTED
        if (decision != PaperStatus.ACCEPTED && decision != PaperStatus.REJECTED) {
            throw new RuntimeException("Quyết định không hợp lệ! Chỉ chấp nhận ACCEPTED hoặc REJECTED.");
        }

        // Cập nhật trạng thái
        paper.setStatus(decision);
        Paper savedPaper = paperRepo.save(paper);
        
        // Chỉ gửi email tự động nếu Chair không dùng AI
        if (!skipEmail) {
            // --- GỌI NOTIFICATION SERVICE ĐỂ GỬI MAIL (Legacy) ---
            notificationService.sendDecisionEmail(
                    savedPaper.getMainAuthor().getEmail(),
                    savedPaper.getMainAuthor().getFullName(),
                    savedPaper.getTitle(),
                    decision
            );
            
            // --- GỌI EMAIL SERVICE MỚI ĐỂ GỬI EMAIL TEMPLATE ---
            try {
                emailService.sendDecisionNotification(savedPaper, decision.name());
            } catch (Exception e) {
                System.err.println("Failed to send decision email: " + e.getMessage());
            }
        }
       
        return savedPaper;
    }

    // 3. Bulk decision - ra quyết định cho nhiều bài cùng lúc
    public java.util.Map<String, Object> bulkMakeDecision(java.util.List<Long> paperIds, PaperStatus decision, String comment) {
        int successCount = 0;
        int failCount = 0;
        java.util.List<String> errors = new java.util.ArrayList<>();
        
        for (Long paperId : paperIds) {
            try {
                makeDecision(paperId, decision, comment);
                successCount++;
            } catch (RuntimeException e) {
                failCount++;
                errors.add("Paper " + paperId + ": " + e.getMessage());
            }
        }
        
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("total", paperIds.size());
        result.put("success", successCount);
        result.put("failed", failCount);
        result.put("errors", errors);
        return result;
    }

    // 4. Lấy thống kê reviews của một paper
    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getReviewStatistics(Long paperId) {
        List<Review> reviews = reviewRepo.findByAssignment_PaperId(paperId);
        
        if (reviews.isEmpty()) {
            java.util.Map<String, Object> emptyStats = new java.util.HashMap<>();
            emptyStats.put("totalReviews", 0);
            emptyStats.put("averageScore", 0.0);
            emptyStats.put("minScore", 0);
            emptyStats.put("maxScore", 0);
            return emptyStats;
        }
        
        double sum = 0;
        int min = reviews.get(0).getScore();
        int max = reviews.get(0).getScore();
        
        for (Review r : reviews) {
            int score = r.getScore();
            sum += score;
            if (score < min) min = score;
            if (score > max) max = score;
        }
        
        double avg = Math.round((sum / reviews.size()) * 100.0) / 100.0;
        
        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("totalReviews", reviews.size());
        stats.put("averageScore", avg);
        stats.put("minScore", min);
        stats.put("maxScore", max);
        stats.put("reviews", reviews);
        return stats;
    }
    
    // 5. Lấy decision của một paper (cho Author xem)
    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getDecisionByPaper(Long paperId) {
        Paper paper = paperRepo.findById(paperId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài báo"));
        
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("paperId", paperId);
        result.put("status", paper.getStatus());
        result.put("decidedAt", paper.getUpdatedAt());
        
        // Có thể thêm comment từ decision nếu có lưu trong database
        // Hiện tại chỉ trả về status
        
        return result;
    }
}