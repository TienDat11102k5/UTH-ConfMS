package edu.uth.backend.assignment;

import edu.uth.backend.email.EmailService;
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
    @Autowired private ConflictOfInterestRepository coiRepo;
    @Autowired private EmailService emailService; 

    // 1. Hàm Phân công (Assign) - TP4
    public ReviewAssignment assignReviewer(Long paperId, Long reviewerId) {
        // a. Kiểm tra bài báo có tồn tại không
        Paper paper = paperRepo.findById(paperId)
                .orElseThrow(() -> new RuntimeException("Lỗi: Bài báo không tồn tại!"));

        // Check if conference is locked
        if (paper.getTrack() != null && paper.getTrack().getConference() != null) {
            Conference conference = paper.getTrack().getConference();
            if (conference.getIsLocked() != null && conference.getIsLocked()) {
                throw new RuntimeException("Hội nghị đã bị khóa, không thể phân công reviewer!");
            }
        }

        // b. Kiểm tra người chấm có tồn tại không
        User reviewer = userRepo.findById(reviewerId)
                .orElseThrow(() -> new RuntimeException("Lỗi: Reviewer không tồn tại!"));

        // c. Check COI Cơ bản: Tác giả không được chấm bài mình
        if (paper.getMainAuthor().getId().equals(reviewerId)) {
            throw new RuntimeException("Lỗi COI: Tác giả không thể tự chấm bài của mình!");
        }
        // Nếu Reviewer đã khai báo xung đột trong bảng conflicts_of_interest thì chặn lại
        if (coiRepo.existsByPaperIdAndReviewerId(paperId, reviewerId)) {
             throw new RuntimeException("Lỗi COI: Không thể phân công vì Reviewer này đã khai báo Xung đột lợi ích!");
        }
        // -----------------------------------------------------------

        // d. Check COI (Nâng cao): Nếu cùng đơn vị công tác (Affiliation)
        // (Giữ lại logic này của bạn vì nó rất tốt)
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
        assignment.setStatus(AssignmentStatus.PENDING); // Trạng thái ban đầu là Chờ xác nhận
        assignment.setAssignedDate(LocalDateTime.now());
        
        // Set dueDate from conference reviewDeadline (via track)
        if (paper.getTrack() != null && paper.getTrack().getConference() != null 
            && paper.getTrack().getConference().getReviewDeadline() != null) {
            assignment.setDueDate(paper.getTrack().getConference().getReviewDeadline());
        }
        
        // (Optional) Cập nhật trạng thái bài báo sang UNDER_REVIEW
        if (paper.getStatus() == PaperStatus.SUBMITTED) {
            paper.setStatus(PaperStatus.UNDER_REVIEW);
            paperRepo.save(paper);
        }

        ReviewAssignment savedAssignment = assignmentRepo.save(assignment);
        
        // Send email notification
        try {
            emailService.sendAssignmentNotification(savedAssignment);
        } catch (Exception e) {
            // Log error but don't fail the assignment
            System.err.println("Failed to send assignment email: " + e.getMessage());
        }
        
        return savedAssignment;
    }

    // 2. Hàm lấy danh sách bài được phân công (Dành cho Reviewer xem - TP5)
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<ReviewAssignment> getMyAssignments(Long reviewerId) {
        List<ReviewAssignment> assignments = assignmentRepo.findByReviewerId(reviewerId);
        // Eager load lazy collections to avoid LazyInitializationException
        for (ReviewAssignment assignment : assignments) {
            if (assignment.getPaper() != null && assignment.getPaper().getCoAuthors() != null) {
                assignment.getPaper().getCoAuthors().size(); // Force initialization
            }
        }
        return assignments;
    }
    
    // 3. Hàm lấy danh sách phân công theo bài báo (Dành cho Chair quản lý - TP4)
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<ReviewAssignment> getAssignmentsByPaper(Long paperId) {
        List<ReviewAssignment> assignments = assignmentRepo.findByPaperId(paperId);
        // Eager load lazy collections to avoid LazyInitializationException
        for (ReviewAssignment assignment : assignments) {
            if (assignment.getPaper() != null && assignment.getPaper().getCoAuthors() != null) {
                assignment.getPaper().getCoAuthors().size(); // Force initialization
            }
        }
        return assignments;
    }

    // 4. Reviewer chấp nhận assignment
    public ReviewAssignment acceptAssignment(Long assignmentId) {
        ReviewAssignment assignment = assignmentRepo.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phân công này!"));
        
        if (assignment.getStatus() != AssignmentStatus.PENDING) {
            throw new RuntimeException("Chỉ có thể chấp nhận assignment ở trạng thái PENDING!");
        }
        
        assignment.setStatus(AssignmentStatus.ACCEPTED);
        return assignmentRepo.save(assignment);
    }

    // 5. Reviewer từ chối assignment
    public ReviewAssignment declineAssignment(Long assignmentId) {
        ReviewAssignment assignment = assignmentRepo.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phân công này!"));
        
        if (assignment.getStatus() != AssignmentStatus.PENDING) {
            throw new RuntimeException("Chỉ có thể từ chối assignment ở trạng thái PENDING!");
        }
        
        assignment.setStatus(AssignmentStatus.DECLINED);
        return assignmentRepo.save(assignment);
    }

    // 6. Bulk assignment - phân công nhiều reviewer cho nhiều paper
    public List<ReviewAssignment> bulkAssign(List<Long> paperIds, List<Long> reviewerIds) {
        List<ReviewAssignment> results = new java.util.ArrayList<>();
        for (Long paperId : paperIds) {
            for (Long reviewerId : reviewerIds) {
                try {
                    ReviewAssignment assignment = assignReviewer(paperId, reviewerId);
                    results.add(assignment);
                } catch (RuntimeException e) {
                    // Log error nhưng tiếp tục với các assignment khác
                    System.err.println("Lỗi khi phân công paper " + paperId + " cho reviewer " + reviewerId + ": " + e.getMessage());
                }
            }
        }
        return results;
    }

    // 7. Lấy assignment theo ID
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ReviewAssignment getAssignmentById(Long assignmentId) {
        ReviewAssignment assignment = assignmentRepo.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy assignment này!"));
        // Eager load lazy collections
        if (assignment.getPaper() != null && assignment.getPaper().getCoAuthors() != null) {
            assignment.getPaper().getCoAuthors().size();
        }
        return assignment;
    }
}