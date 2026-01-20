package edu.uth.backend.decision;

import edu.uth.backend.email.EmailService;
import edu.uth.backend.entity.*;
import edu.uth.backend.notification.NotificationService;
import edu.uth.backend.repository.PaperRepository;
import edu.uth.backend.repository.ReviewRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DecisionServiceTest {

    @Mock
    private PaperRepository paperRepo;

    @Mock
    private ReviewRepository reviewRepo;

    @Mock
    private NotificationService notificationService;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private DecisionService decisionService;

    private Paper paper;
    private Conference conference;
    private Track track;
    private User author;
    private Review review1;
    private Review review2;

    @BeforeEach
    void setUp() {
        author = new User();
        author.setId(10L);
        author.setEmail("author@test.com");
        author.setFullName("Author Name");

        conference = new Conference();
        conference.setId(1L);
        conference.setIsLocked(false);

        track = new Track();
        track.setId(1L);
        track.setConference(conference);

        paper = new Paper();
        paper.setId(100L);
        paper.setTitle("Test Paper Title");
        paper.setAbstractText("Test Abstract");
        paper.setStatus(PaperStatus.UNDER_REVIEW);
        paper.setMainAuthor(author);
        paper.setTrack(track);

        review1 = new Review();
        review1.setId(1L);
        review1.setScore(2); // Accepted
        
        review2 = new Review();
        review2.setId(2L);
        review2.setScore(0); // Borderline
    }

    @Test
    void testCalculateAverageScore_NoReviews() {
        when(reviewRepo.findByAssignment_PaperId(100L)).thenReturn(new ArrayList<>());

        double avg = decisionService.calculateAverageScore(100L);

        assertEquals(0.0, avg);
        verify(reviewRepo).findByAssignment_PaperId(100L);
    }

    @Test
    void testCalculateAverageScore_WithReviews() {
        when(reviewRepo.findByAssignment_PaperId(100L)).thenReturn(Arrays.asList(review1, review2));

        double avg = decisionService.calculateAverageScore(100L);

        // (2 + 0) / 2 = 1.0
        assertEquals(1.0, avg);
        verify(reviewRepo).findByAssignment_PaperId(100L);
    }

    @Test
    void testMakeDecision_PaperNotFound() {
        when(paperRepo.findById(999L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> 
            decisionService.makeDecision(999L, PaperStatus.ACCEPTED, "Good")
        );
    }

    @Test
    void testMakeDecision_ConferenceLocked() {
        conference.setIsLocked(true);
        when(paperRepo.findById(100L)).thenReturn(Optional.of(paper));

        assertThrows(RuntimeException.class, () -> 
            decisionService.makeDecision(100L, PaperStatus.ACCEPTED, "Good")
        );
    }

    @Test
    void testMakeDecision_InvalidStatus() {
        when(paperRepo.findById(100L)).thenReturn(Optional.of(paper));

        assertThrows(RuntimeException.class, () -> 
            decisionService.makeDecision(100L, PaperStatus.SUBMITTED, "Invalid")
        );
    }

    @Test
    void testMakeDecision_Success_Accepted() {
        when(paperRepo.findById(100L)).thenReturn(Optional.of(paper));
        when(paperRepo.save(any(Paper.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Paper result = decisionService.makeDecision(100L, PaperStatus.ACCEPTED, "Congratulations");

        assertEquals(PaperStatus.ACCEPTED, result.getStatus());
        verify(paperRepo).save(paper);
        // Verify email sent (both services called as per implementation)
        verify(notificationService).sendDecisionEmail(eq("author@test.com"), anyString(), anyString(), eq(PaperStatus.ACCEPTED));
        verify(emailService).sendDecisionNotification(eq(paper), eq("ACCEPTED"));
    }

    @Test
    void testMakeDecision_Success_Rejected_SkipEmail() {
        when(paperRepo.findById(100L)).thenReturn(Optional.of(paper));
        when(paperRepo.save(any(Paper.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Paper result = decisionService.makeDecision(100L, PaperStatus.REJECTED, "Sorry", true);

        assertEquals(PaperStatus.REJECTED, result.getStatus());
        verify(paperRepo).save(paper);
        // Verify email NOT sent
        verify(notificationService, never()).sendDecisionEmail(anyString(), anyString(), anyString(), any());
        verify(emailService, never()).sendDecisionNotification(any(), anyString());
    }

    @Test
    void testBulkMakeDecision_MixedResults() {
        Paper p1 = new Paper(); p1.setId(1L); p1.setTrack(track); p1.setMainAuthor(author);
        Paper p2 = new Paper(); p2.setId(2L); // No track/conference setup setup slightly different or mock findById

        // Mock paperRepo finding p1
        when(paperRepo.findById(1L)).thenReturn(Optional.of(p1));
        when(paperRepo.save(p1)).thenReturn(p1);
        
        // Mock paperRepo finding p2 but throwing exception inside makeDecision (e.g. not found or locked)
        // Actually easiest is to just let findById return empty for p2 to trigger RuntimeException
        when(paperRepo.findById(2L)).thenReturn(Optional.empty());

        List<Long> paperIds = Arrays.asList(1L, 2L);
        Map<String, Object> result = decisionService.bulkMakeDecision(paperIds, PaperStatus.ACCEPTED, "Bulk decision");

        assertEquals(2, result.get("total"));
        assertEquals(1, result.get("success"));
        assertEquals(1, result.get("failed"));
        @SuppressWarnings("unchecked")
        List<String> errors = (List<String>) result.get("errors");
        assertFalse(errors.isEmpty());
    }

    @Test
    void testGetReviewStatistics_NoReviews() {
        when(reviewRepo.findByAssignment_PaperId(100L)).thenReturn(new ArrayList<>());

        Map<String, Object> stats = decisionService.getReviewStatistics(100L);

        assertEquals(0, stats.get("totalReviews"));
        assertEquals(0.0, stats.get("averageScore"));
    }

    @Test
    void testGetReviewStatistics_WithReviews() {
        // review1: 2, review2: 0
        when(reviewRepo.findByAssignment_PaperId(100L)).thenReturn(Arrays.asList(review1, review2));

        Map<String, Object> stats = decisionService.getReviewStatistics(100L);

        assertEquals(2, stats.get("totalReviews"));
        assertEquals(1.0, stats.get("averageScore"));
        assertEquals(0, stats.get("minScore"));
        assertEquals(2, stats.get("maxScore"));
        assertNotNull(stats.get("reviews"));
    }

    @Test
    void testGetDecisionByPaper_Success() {
        paper.setStatus(PaperStatus.ACCEPTED);
        paper.setUpdatedAt(LocalDateTime.now());
        when(paperRepo.findById(100L)).thenReturn(Optional.of(paper));

        Map<String, Object> result = decisionService.getDecisionByPaper(100L);

        assertEquals(100L, result.get("paperId"));
        assertEquals(PaperStatus.ACCEPTED, result.get("status"));
        assertNotNull(result.get("decidedAt"));
    }
}
