package edu.uth.backend.review;

import edu.uth.backend.entity.*;
import edu.uth.backend.repository.*;
import edu.uth.backend.email.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

import java.util.List;

@Service
@Transactional
public class ReviewService {

    @Autowired private ReviewRepository reviewRepo;
    @Autowired private ReviewAssignmentRepository assignmentRepo;
    @Autowired private EmailService emailService;

    // Hàm Chấm điểm (Submit Review)
    public Review submitReview(Long assignmentId, int score, int confidence, String commentAuthor, String commentPC) {
        // 1. Tìm cái phân công việc
        ReviewAssignment assignment = assignmentRepo.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phân công này!"));

        // Check if conference is locked
        if (assignment.getPaper() != null && assignment.getPaper().getTrack() != null 
            && assignment.getPaper().getTrack().getConference() != null) {
            Conference conference = assignment.getPaper().getTrack().getConference();
            if (conference.getIsLocked() != null && conference.getIsLocked()) {
                throw new RuntimeException("Hội nghị đã bị khóa, không thể nộp đánh giá!");
            }
        }

        // 2. Kiểm tra trạng thái
        // Phải đồng ý chấm (ACCEPTED) hoặc đang chờ (PENDING) mới được chấm.
        // Nếu đã chấm rồi (COMPLETED) thì chặn hoặc cho sửa (tùy logic, ở đây mình chặn cho đơn giản)
        if (assignment.getStatus() == AssignmentStatus.COMPLETED) {
            throw new RuntimeException("Bạn đã chấm bài này rồi, không thể chấm lại!");
        }

        // 3. Validate điểm số (Ví dụ thang điểm -3 đến +3 theo chuẩn EasyChair)
        if (score < -3 || score > 3) {
            throw new RuntimeException("Điểm số không hợp lệ (Phải từ -3 đến +3)!");
        }

        // 4. Lưu Review vào bảng 'reviews'
        Review review = new Review();
        review.setAssignment(assignment);
        review.setScore(score);
        review.setConfidenceLevel(confidence);
        review.setCommentForAuthor(commentAuthor);
        review.setCommentForPC(commentPC);
        review.setSubmittedAt(LocalDateTime.now());
        
        Review savedReview = reviewRepo.save(review);

        // 5. Cập nhật trạng thái phân công thành ĐÃ XONG (COMPLETED)
        assignment.setStatus(AssignmentStatus.COMPLETED);
        assignmentRepo.save(assignment);

        // 6. Gửi email thông báo cho Chair
        try {
            emailService.sendReviewSubmittedNotification(savedReview);
        } catch (Exception e) {
            // Log error but don't fail the review submission
            System.err.println("Failed to send review notification email: " + e.getMessage());
        }

        return savedReview;
    }

    // Lấy tất cả reviews của một paper
    @Transactional(readOnly = true)
    public List<Review> getReviewsByPaper(Long paperId) {
        return reviewRepo.findByAssignment_PaperId(paperId);
    }

    // Lấy review của một assignment cụ thể
    @Transactional(readOnly = true)
    public Review getReviewByAssignment(Long assignmentId) {
        Review review = reviewRepo.findByAssignmentId(assignmentId).orElse(null);
        
        // Log để debug
        if (review == null) {
            System.out.println("No review found for assignment: " + assignmentId);
        } else {
            System.out.println("Found review for assignment: " + assignmentId + ", review ID: " + review.getId());
        }
        
        return review; // Trả về null nếu chưa có review
    }
    
    // Lấy reviews cho Author xem (chỉ hiển thị commentForAuthor, ẩn commentForPC)
    @Transactional(readOnly = true)
    public List<Review> getReviewsForAuthor(Long paperId) {
        List<Review> reviews = reviewRepo.findByAssignment_PaperId(paperId);
        // Clear commentForPC để không lộ thông tin nội bộ
        reviews.forEach(review -> review.setCommentForPC(null));
        return reviews;
    }
}