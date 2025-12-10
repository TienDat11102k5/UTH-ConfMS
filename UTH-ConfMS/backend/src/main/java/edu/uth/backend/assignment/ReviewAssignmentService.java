package edu.uth.backend.assignment;

import edu.uth.backend.entity.*;
import edu.uth.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReviewAssignmentService {

    @Autowired private ReviewAssignmentRepository assignmentRepo;
    @Autowired private PaperRepository paperRepo;
    @Autowired private UserRepository userRepo;

    // 1. Hàm Phân công (Assign) - TP4
    public ReviewAssignment assignReviewer(Long paperId, Long reviewerId) {
        // a. Kiểm tra bài báo có tồn tại không
        Paper paper = paperRepo.findById(paperId)
                .orElseThrow(() -> new RuntimeException("Lỗi: Bài báo không tồn tại!"));

        // b. Kiểm tra người chấm có tồn tại không
        User reviewer = userRepo.findById(reviewerId)
                .orElseThrow(() -> new RuntimeException("Lỗi: Reviewer không tồn tại!"));

        // c. Check COI (Xung đột lợi ích): Tác giả không được chấm bài mình [cite: 865]
        if (paper.getMainAuthor().getId().equals(reviewerId)) {
            throw new RuntimeException("Lỗi COI: Tác giả không thể tự chấm bài của mình!");
        }

        // d. Check COI (Nâng cao): Nếu cùng đơn vị công tác (Affiliation) [cite: 865]
        // (Logic này tùy chọn, nhưng rất nên có cho đồ án xịn)
        String authorAffiliation = paper.getMainAuthor().getAffiliation();
        String reviewerAffiliation = reviewer.getAffiliation();
        if (authorAffiliation != null && reviewerAffiliation != null && 
            authorAffiliation.equalsIgnoreCase(reviewerAffiliation)) {
             throw new RuntimeException("Cảnh báo COI: Reviewer và Tác giả cùng đơn vị công tác (" + authorAffiliation + ")!");
        }

        // e. Kiểm tra xem đã phân công cho ông này chưa (Tránh trùng)
        if (assignmentRepo.existsByPaperIdAndReviewerId(paperId, reviewerId)) {
            throw new RuntimeException("Lỗi: Reviewer này đã được phân công cho bài báo này rồi!");
        }

        // f. Lưu phân công
        ReviewAssignment assignment = new ReviewAssignment();
        assignment.setPaper(paper);
        assignment.setReviewer(reviewer);
        assignment.setStatus(AssignmentStatus.PENDING); // Trạng thái ban đầu là Chờ xác nhận [cite: 250]
        assignment.setAssignedDate(LocalDateTime.now());
        
        // (Optional) Cập nhật trạng thái bài báo sang UNDER_REVIEW
        if (paper.getStatus() == PaperStatus.SUBMITTED) {
            paper.setStatus(PaperStatus.UNDER_REVIEW);
            paperRepo.save(paper);
        }

        return assignmentRepo.save(assignment);
    }

    // 2. Hàm lấy danh sách bài được phân công (Dành cho Reviewer xem - TP5)
    public List<ReviewAssignment> getMyAssignments(Long reviewerId) {
        return assignmentRepo.findByReviewerId(reviewerId);
    }
    
    // 3. Hàm lấy danh sách phân công theo bài báo (Dành cho Chair quản lý - TP4)
    public List<ReviewAssignment> getAssignmentsByPaper(Long paperId) {
        return assignmentRepo.findByPaperId(paperId);
    }
}