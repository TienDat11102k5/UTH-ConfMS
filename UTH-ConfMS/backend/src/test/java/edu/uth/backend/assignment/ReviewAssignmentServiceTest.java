package edu.uth.backend.assignment;

import edu.uth.backend.entity.*;

import edu.uth.backend.repository.*;
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
 * Unit Tests cho ReviewAssignmentService
 * Test các chức năng: Assign Reviewer, Check COI, Get Assignments
 */
@ExtendWith(MockitoExtension.class)
class ReviewAssignmentServiceTest {

    @Mock
    private ReviewAssignmentRepository assignmentRepo;

    @Mock
    private PaperRepository paperRepo;

    @Mock
    private UserRepository userRepo;

    @Mock
    private ConflictOfInterestRepository coiRepo;

    @InjectMocks
    private ReviewAssignmentService assignmentService;

    private User testReviewer;
    private User testAuthor;
    private Paper testPaper;
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
        testConference.setReviewDeadline(LocalDateTime.now().plusDays(30));
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
        testPaper.setStatus(PaperStatus.SUBMITTED);
    }

    // ==================== ASSIGN REVIEWER TESTS ====================

    @Test
    void testAssignReviewer_Success() {
        // Arrange
        when(paperRepo.findById(1L)).thenReturn(Optional.of(testPaper));
        when(userRepo.findById(2L)).thenReturn(Optional.of(testReviewer));
        when(coiRepo.existsByPaperIdAndReviewerId(1L, 2L)).thenReturn(false);
        when(assignmentRepo.existsByPaperIdAndReviewerId(1L, 2L)).thenReturn(false);
        when(assignmentRepo.save(any(ReviewAssignment.class))).thenAnswer(invocation -> {
            ReviewAssignment assignment = invocation.getArgument(0);
            assignment.setId(1L);
            return assignment;
        });

        // Act
        ReviewAssignment result = assignmentService.assignReviewer(1L, 2L);

        // Assert
        assertNotNull(result);
        assertEquals(testPaper, result.getPaper());
        assertEquals(testReviewer, result.getReviewer());
        assertEquals(AssignmentStatus.PENDING, result.getStatus());
        assertNotNull(result.getAssignedDate());
        verify(assignmentRepo).save(any(ReviewAssignment.class));
    }

    @Test
    void testAssignReviewer_PaperNotFound_ThrowsException() {
        // Arrange
        when(paperRepo.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(
            RuntimeException.class,
            () -> assignmentService.assignReviewer(999L, 2L)
        );
    }

    @Test
    void testAssignReviewer_ReviewerNotFound_ThrowsException() {
        // Arrange
        when(paperRepo.findById(1L)).thenReturn(Optional.of(testPaper));
        when(userRepo.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(
            RuntimeException.class,
            () -> assignmentService.assignReviewer(1L, 999L)
        );
    }

    @Test
    void testAssignReviewer_COIExists_ThrowsException() {
        // Arrange
        when(paperRepo.findById(1L)).thenReturn(Optional.of(testPaper));
        when(userRepo.findById(2L)).thenReturn(Optional.of(testReviewer));
        when(coiRepo.existsByPaperIdAndReviewerId(1L, 2L)).thenReturn(true);

        // Act & Assert
        RuntimeException exception = assertThrows(
            RuntimeException.class,
            () -> assignmentService.assignReviewer(1L, 2L)
        );
        assertTrue(exception.getMessage().contains("COI") || exception.getMessage().contains("lợi ích"));
    }

    @Test
    void testAssignReviewer_AlreadyAssigned_ThrowsException() {
        // Arrange
        when(paperRepo.findById(1L)).thenReturn(Optional.of(testPaper));
        when(userRepo.findById(2L)).thenReturn(Optional.of(testReviewer));
        when(coiRepo.existsByPaperIdAndReviewerId(1L, 2L)).thenReturn(false);
        when(assignmentRepo.existsByPaperIdAndReviewerId(1L, 2L)).thenReturn(true);

        // Act & Assert
        RuntimeException exception = assertThrows(
            RuntimeException.class,
            () -> assignmentService.assignReviewer(1L, 2L)
        );
        assertTrue(exception.getMessage().contains("đã được phân công") || exception.getMessage().contains("phân công"));
    }

    @Test
    void testAssignReviewer_ConferenceLocked_ThrowsException() {
        // Arrange
        testConference.setIsLocked(true);
        when(paperRepo.findById(1L)).thenReturn(Optional.of(testPaper));

        // Act & Assert
        RuntimeException exception = assertThrows(
            RuntimeException.class,
            () -> assignmentService.assignReviewer(1L, 2L)
        );
        assertTrue(exception.getMessage().contains("khóa"));
    }

    // ==================== GET ASSIGNMENTS TESTS ====================

    @Test
    void testGetAssignmentsByReviewer_Success() {
        // Arrange
        List<ReviewAssignment> mockAssignments = new ArrayList<>();
        
        ReviewAssignment assignment1 = new ReviewAssignment();
        assignment1.setId(1L);
        assignment1.setPaper(testPaper);
        assignment1.setReviewer(testReviewer);
        assignment1.setStatus(AssignmentStatus.PENDING);
        mockAssignments.add(assignment1);

        ReviewAssignment assignment2 = new ReviewAssignment();
        assignment2.setId(2L);
        assignment2.setPaper(testPaper);
        assignment2.setReviewer(testReviewer);
        assignment2.setStatus(AssignmentStatus.ACCEPTED);
        mockAssignments.add(assignment2);

        when(assignmentRepo.findByReviewerId(2L)).thenReturn(mockAssignments);

        // Act
        List<ReviewAssignment> result = assignmentService.getMyAssignments(2L);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        verify(assignmentRepo).findByReviewerId(2L);
    }

    @Test
    void testGetAssignmentsByPaper_Success() {
        // Arrange
        List<ReviewAssignment> mockAssignments = new ArrayList<>();
        
        ReviewAssignment assignment = new ReviewAssignment();
        assignment.setId(1L);
        assignment.setPaper(testPaper);
        assignment.setReviewer(testReviewer);
        assignment.setStatus(AssignmentStatus.COMPLETED);
        mockAssignments.add(assignment);

        when(assignmentRepo.findByPaperId(1L)).thenReturn(mockAssignments);

        // Act
        List<ReviewAssignment> result = assignmentService.getAssignmentsByPaper(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(AssignmentStatus.COMPLETED, result.get(0).getStatus());
    }


}
