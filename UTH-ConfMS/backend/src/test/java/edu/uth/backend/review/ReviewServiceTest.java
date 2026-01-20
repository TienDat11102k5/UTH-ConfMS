package edu.uth.backend.review;

import edu.uth.backend.email.EmailService;
import edu.uth.backend.entity.*;
import edu.uth.backend.repository.ReviewAssignmentRepository;
import edu.uth.backend.repository.ReviewRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit Tests cho ReviewService
 * Test các chức năng: Submit Review, Get Reviews
 */
@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock
    private ReviewRepository reviewRepo;

    @Mock
    private ReviewAssignmentRepository assignmentRepo;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private ReviewService reviewService;

    private User testReviewer;
    private User testAuthor;
    private Paper testPaper;
    private ReviewAssignment testAssignment;
    private Conference testConference;
    private Track testTrack;

    @BeforeEach
    void setUp() {
        // Setup test reviewer
        testReviewer = new User();
        testReviewer.setId(2L);
        testReviewer.setEmail("reviewer@example.com");
        testReviewer.setFullName("Test Reviewer");

        // Setup test author
        testAuthor = new User();
        testAuthor.setId(1L);
        testAuthor.setEmail("author@example.com");
        testAuthor.setFullName("Test Author");

        // Setup test conference
        testConference = new Conference();
        testConference.setId(1L);
        testConference.setName("Test Conference");
        testConference.setIsLocked(false);

        // Setup test track
        testTrack = new Track();
        testTrack.setId(1L);
        testTrack.setConference(testConference);

        // Setup test paper
        testPaper = new Paper();
        testPaper.setId(1L);
        testPaper.setTitle("Test Paper");
        testPaper.setMainAuthor(testAuthor);
        testPaper.setTrack(testTrack);
        testPaper.setStatus(PaperStatus.UNDER_REVIEW);

        // Setup test assignment
        testAssignment = new ReviewAssignment();
        testAssignment.setId(1L);
        testAssignment.setPaper(testPaper);
        testAssignment.setReviewer(testReviewer);
        testAssignment.setStatus(AssignmentStatus.ACCEPTED);
        testAssignment.setAssignedDate(LocalDateTime.now());
    }

    // ==================== SUBMIT REVIEW TESTS ====================

    @Test
    void testSubmitReview_Success() {
        // Arrange
        int score = 2;
        int confidence = 4;
        String commentAuthor = "Good paper with minor issues";
        String commentPC = "Recommend accept with revisions";

        when(assignmentRepo.findById(1L)).thenReturn(Optional.of(testAssignment));
        when(reviewRepo.save(any(Review.class))).thenAnswer(invocation -> {
            Review review = invocation.getArgument(0);
            review.setId(1L);
            return review;
        });
        when(assignmentRepo.save(any(ReviewAssignment.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(emailService).sendReviewSubmittedNotification(any(Review.class));

        // Act
        Review result = reviewService.submitReview(1L, score, confidence, commentAuthor, commentPC);

        // Assert
        assertNotNull(result);
        assertEquals(score, result.getScore());
        assertEquals(confidence, result.getConfidenceLevel());
        assertEquals(commentAuthor, result.getCommentForAuthor());
        assertEquals(commentPC, result.getCommentForPC());
        assertNotNull(result.getSubmittedAt());
        
        verify(reviewRepo).save(any(Review.class));
        verify(assignmentRepo).save(argThat(assignment -> 
            assignment.getStatus() == AssignmentStatus.COMPLETED
        ));
        verify(emailService).sendReviewSubmittedNotification(any(Review.class));
    }

    @Test
    void testSubmitReview_AssignmentNotFound_ThrowsException() {
        // Arrange
        when(assignmentRepo.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(
            RuntimeException.class,
            () -> reviewService.submitReview(999L, 2, 4, "Comment", "PC Comment")
        );
        assertTrue(exception.getMessage().contains("Không tìm thấy phân công"));
    }

    @Test
    void testSubmitReview_AlreadyCompleted_ThrowsException() {
        // Arrange
        testAssignment.setStatus(AssignmentStatus.COMPLETED);
        when(assignmentRepo.findById(1L)).thenReturn(Optional.of(testAssignment));

        // Act & Assert
        RuntimeException exception = assertThrows(
            RuntimeException.class,
            () -> reviewService.submitReview(1L, 2, 4, "Comment", "PC Comment")
        );
        assertTrue(exception.getMessage().contains("đã chấm bài này rồi"));
    }

    @Test
    void testSubmitReview_InvalidScore_ThrowsException() {
        // Arrange
        when(assignmentRepo.findById(1L)).thenReturn(Optional.of(testAssignment));

        // Act & Assert - Score too high
        RuntimeException exception1 = assertThrows(
            RuntimeException.class,
            () -> reviewService.submitReview(1L, 5, 4, "Comment", "PC Comment")
        );
        assertTrue(exception1.getMessage().contains("Điểm số không hợp lệ"));

        // Act & Assert - Score too low
        RuntimeException exception2 = assertThrows(
            RuntimeException.class,
            () -> reviewService.submitReview(1L, -5, 4, "Comment", "PC Comment")
        );
        assertTrue(exception2.getMessage().contains("Điểm số không hợp lệ"));
    }

    @Test
    void testSubmitReview_ConferenceLocked_ThrowsException() {
        // Arrange
        testConference.setIsLocked(true);
        when(assignmentRepo.findById(1L)).thenReturn(Optional.of(testAssignment));

        // Act & Assert
        RuntimeException exception = assertThrows(
            RuntimeException.class,
            () -> reviewService.submitReview(1L, 2, 4, "Comment", "PC Comment")
        );
        assertTrue(exception.getMessage().contains("đã bị khóa"));
    }

    // ==================== GET REVIEWS TESTS ====================

    @Test
    void testGetReviewsByPaper_Success() {
        // Arrange
        List<Review> mockReviews = new ArrayList<>();
        Review review1 = new Review();
        review1.setId(1L);
        review1.setScore(2);
        review1.setAssignment(testAssignment);
        mockReviews.add(review1);

        Review review2 = new Review();
        review2.setId(2L);
        review2.setScore(1);
        review2.setAssignment(testAssignment);
        mockReviews.add(review2);

        when(reviewRepo.findByAssignment_PaperId(1L)).thenReturn(mockReviews);

        // Act
        List<Review> result = reviewService.getReviewsByPaper(1L);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        verify(reviewRepo).findByAssignment_PaperId(1L);
    }

    @Test
    void testGetReviewByAssignment_Found() {
        // Arrange
        Review mockReview = new Review();
        mockReview.setId(1L);
        mockReview.setScore(2);
        mockReview.setAssignment(testAssignment);

        when(reviewRepo.findByAssignmentId(1L)).thenReturn(Optional.of(mockReview));

        // Act
        Review result = reviewService.getReviewByAssignment(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals(2, result.getScore());
    }

    @Test
    void testGetReviewByAssignment_NotFound() {
        // Arrange
        when(reviewRepo.findByAssignmentId(999L)).thenReturn(Optional.empty());

        // Act
        Review result = reviewService.getReviewByAssignment(999L);

        // Assert
        assertNull(result);
    }
}
