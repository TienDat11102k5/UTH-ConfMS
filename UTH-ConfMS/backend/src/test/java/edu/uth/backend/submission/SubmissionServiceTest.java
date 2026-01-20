package edu.uth.backend.submission;

import edu.uth.backend.common.FileStorageUtil;
import edu.uth.backend.common.FileValidationService;
import edu.uth.backend.entity.*;
import edu.uth.backend.exception.ResourceNotFoundException;
import edu.uth.backend.history.UserActivityHistoryService;
import edu.uth.backend.repository.*;
import edu.uth.backend.submission.dto.CoAuthorDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit Tests cho SubmissionService
 * Test các chức năng: Submit Paper, Update Paper, Withdraw Paper
 */
@ExtendWith(MockitoExtension.class)
class SubmissionServiceTest {

    @Mock
    private PaperRepository paperRepo;

    @Mock
    private UserRepository userRepo;

    @Mock
    private TrackRepository trackRepo;

    @Mock
    private ConferenceRepository conferenceRepo;

    @Mock
    private FileStorageUtil fileStorageUtil;

    @Mock
    private FileValidationService fileValidationService;

    @Mock
    private PaperCoAuthorRepository coAuthorRepo;

    @Mock
    private ReviewAssignmentRepository reviewAssignmentRepo;

    @Mock
    private UserActivityHistoryService activityHistoryService;

    @InjectMocks
    private SubmissionService submissionService;

    private User testAuthor;
    private Track testTrack;
    private Conference testConference;
    private MultipartFile mockFile;
    private Paper testPaper;

    @BeforeEach
    void setUp() {
        // Setup test author
        testAuthor = new User();
        testAuthor.setId(1L);
        testAuthor.setEmail("author@example.com");
        testAuthor.setFullName("Test Author");

        // Setup test conference
        testConference = new Conference();
        testConference.setId(1L);
        testConference.setName("Test Conference 2025");
        testConference.setSubmissionDeadline(LocalDateTime.now().plusDays(30));
        testConference.setIsLocked(false);

        // Setup test track
        testTrack = new Track();
        testTrack.setId(1L);
        testTrack.setName("AI & Machine Learning");
        testTrack.setConference(testConference);

        // Setup test paper
        testPaper = new Paper();
        testPaper.setId(1L);
        testPaper.setTitle("Test Paper Title");
        testPaper.setAbstractText("Test abstract");
        testPaper.setMainAuthor(testAuthor);
        testPaper.setTrack(testTrack);
        testPaper.setStatus(PaperStatus.SUBMITTED);
        testPaper.setFilePath("submissions/test-paper.pdf");

        // Setup mock file
        mockFile = mock(MultipartFile.class);
    }

    // ==================== SUBMIT PAPER TESTS ====================

    @Test
    void testSubmitPaper_Success() {
        // Arrange
        String title = "New Research Paper";
        String abstractText = "This is a test abstract";
        String keywords = "AI, Machine Learning, Deep Learning";
        List<CoAuthorDTO> coAuthors = new ArrayList<>();

        when(paperRepo.existsByMainAuthorIdAndTrackIdAndTitle(anyLong(), anyLong(), anyString()))
            .thenReturn(false);
        when(userRepo.findById(1L)).thenReturn(Optional.of(testAuthor));
        when(trackRepo.findById(1L)).thenReturn(Optional.of(testTrack));
        when(fileStorageUtil.saveFile(any(MultipartFile.class), anyString()))
            .thenReturn("submissions/new-paper.pdf");
        when(paperRepo.save(any(Paper.class))).thenReturn(testPaper);
        doNothing().when(fileValidationService).validatePdfFile(any(MultipartFile.class));

        // Act
        Paper result = submissionService.submitPaper(
            title, abstractText, 1L, 1L, mockFile, coAuthors, keywords
        );

        // Assert
        assertNotNull(result);
        assertEquals(PaperStatus.SUBMITTED, result.getStatus());
        verify(paperRepo).save(any(Paper.class));
        verify(fileStorageUtil).saveFile(any(MultipartFile.class), eq("submissions"));
    }

    @Test
    void testSubmitPaper_DuplicateTitle_ThrowsException() {
        // Arrange
        when(paperRepo.existsByMainAuthorIdAndTrackIdAndTitle(1L, 1L, "Duplicate Title"))
            .thenReturn(true);
        doNothing().when(fileValidationService).validatePdfFile(any(MultipartFile.class));

        // Act & Assert
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> submissionService.submitPaper(
                "Duplicate Title", "Abstract", 1L, 1L, mockFile, null, "keywords"
            )
        );
        assertTrue(exception.getMessage().contains("đã nộp bài báo có tiêu đề này"));
        verify(paperRepo, never()).save(any(Paper.class));
    }

    @Test
    void testSubmitPaper_DeadlinePassed_ThrowsException() {
        // Arrange
        testConference.setSubmissionDeadline(LocalDateTime.now().minusDays(1)); // Past deadline

        when(paperRepo.existsByMainAuthorIdAndTrackIdAndTitle(anyLong(), anyLong(), anyString()))
            .thenReturn(false);
        when(userRepo.findById(1L)).thenReturn(Optional.of(testAuthor));
        when(trackRepo.findById(1L)).thenReturn(Optional.of(testTrack));
        doNothing().when(fileValidationService).validatePdfFile(any(MultipartFile.class));

        // Act & Assert
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> submissionService.submitPaper(
                "Title", "Abstract", 1L, 1L, mockFile, null, "keywords"
            )
        );
        assertTrue(exception.getMessage().contains("quá hạn nộp bài"));
    }

    @Test
    void testSubmitPaper_ConferenceLocked_ThrowsException() {
        // Arrange
        testConference.setIsLocked(true);

        when(paperRepo.existsByMainAuthorIdAndTrackIdAndTitle(anyLong(), anyLong(), anyString()))
            .thenReturn(false);
        when(userRepo.findById(1L)).thenReturn(Optional.of(testAuthor));
        when(trackRepo.findById(1L)).thenReturn(Optional.of(testTrack));
        doNothing().when(fileValidationService).validatePdfFile(any(MultipartFile.class));

        // Act & Assert
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> submissionService.submitPaper(
                "Title", "Abstract", 1L, 1L, mockFile, null, "keywords"
            )
        );
        assertTrue(exception.getMessage().contains("đã bị khóa"));
    }

    @Test
    void testSubmitPaper_UserNotFound_ThrowsException() {
        // Arrange
        when(paperRepo.existsByMainAuthorIdAndTrackIdAndTitle(anyLong(), anyLong(), anyString()))
            .thenReturn(false);
        when(userRepo.findById(999L)).thenReturn(Optional.empty());
        doNothing().when(fileValidationService).validatePdfFile(any(MultipartFile.class));

        // Act & Assert
        assertThrows(
            ResourceNotFoundException.class,
            () -> submissionService.submitPaper(
                "Title", "Abstract", 999L, 1L, mockFile, null, "keywords"
            )
        );
    }

    @Test
    void testSubmitPaper_TrackNotFound_ThrowsException() {
        // Arrange
        when(paperRepo.existsByMainAuthorIdAndTrackIdAndTitle(anyLong(), anyLong(), anyString()))
            .thenReturn(false);
        when(userRepo.findById(1L)).thenReturn(Optional.of(testAuthor));
        when(trackRepo.findById(999L)).thenReturn(Optional.empty());
        doNothing().when(fileValidationService).validatePdfFile(any(MultipartFile.class));

        // Act & Assert
        assertThrows(
            ResourceNotFoundException.class,
            () -> submissionService.submitPaper(
                "Title", "Abstract", 1L, 999L, mockFile, null, "keywords"
            )
        );
    }

    @Test
    void testSubmitPaper_WithCoAuthors_Success() {
        // Arrange
        List<CoAuthorDTO> coAuthors = new ArrayList<>();
        CoAuthorDTO coAuthor1 = new CoAuthorDTO();
        coAuthor1.setName("Co-Author 1");
        coAuthor1.setEmail("coauthor1@example.com");
        coAuthor1.setAffiliation("UTH University");
        coAuthors.add(coAuthor1);

        when(paperRepo.existsByMainAuthorIdAndTrackIdAndTitle(anyLong(), anyLong(), anyString()))
            .thenReturn(false);
        when(userRepo.findById(1L)).thenReturn(Optional.of(testAuthor));
        when(trackRepo.findById(1L)).thenReturn(Optional.of(testTrack));
        when(fileStorageUtil.saveFile(any(MultipartFile.class), anyString()))
            .thenReturn("submissions/paper-with-coauthors.pdf");
        when(paperRepo.save(any(Paper.class))).thenReturn(testPaper);
        when(coAuthorRepo.save(any(PaperCoAuthor.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(fileValidationService).validatePdfFile(any(MultipartFile.class));

        // Act
        Paper result = submissionService.submitPaper(
            "Title", "Abstract", 1L, 1L, mockFile, coAuthors, "keywords"
        );

        // Assert
        assertNotNull(result);
        verify(coAuthorRepo, times(1)).save(any(PaperCoAuthor.class));
    }

    // ==================== UPDATE PAPER TESTS ====================

    @Test
    void testUpdatePaper_Success() {
        // Arrange
        String newTitle = "Updated Title";
        String newAbstract = "Updated Abstract";
        
        when(paperRepo.findById(1L)).thenReturn(Optional.of(testPaper));
        doNothing().when(fileValidationService).validatePdfFile(any(MultipartFile.class));
        when(fileStorageUtil.saveFile(any(MultipartFile.class), anyString()))
            .thenReturn("submissions/updated-paper.pdf");
        when(paperRepo.save(any(Paper.class))).thenReturn(testPaper);

        // Act
        Paper result = submissionService.updatePaper(1L, newTitle, newAbstract, mockFile, 1L);

        // Assert
        assertEquals(newTitle, result.getTitle());
        assertEquals(newAbstract, result.getAbstractText());
        assertEquals(PaperStatus.SUBMITTED, result.getStatus());
        verify(paperRepo).save(testPaper);
        verify(fileStorageUtil).deleteFile(anyString(), anyString()); // Old file deleted
    }

    @Test
    void testUpdatePaper_Unauthorized_ThrowsException() {
        // Arrange
        testPaper.getMainAuthor().setId(2L); // Different author
        when(paperRepo.findById(1L)).thenReturn(Optional.of(testPaper));

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> 
            submissionService.updatePaper(1L, "Title", "Abstract", mockFile, 1L)
        );
    }

    @Test
    void testUpdatePaper_DeadlinePassed_ThrowsException() {
        // Arrange
        testConference.setSubmissionDeadline(LocalDateTime.now().minusDays(1));
        when(paperRepo.findById(1L)).thenReturn(Optional.of(testPaper));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> 
            submissionService.updatePaper(1L, "Title", "Abstract", mockFile, 1L)
        );
        assertTrue(exception.getMessage().contains("Đã hết hạn") || 
                   exception.getMessage().contains("hết hạn") ||
                   exception.getMessage().contains("deadline"));
    }

    // ==================== WITHDRAW PAPER TESTS ====================

    @Test
    void testWithdrawPaper_Success() {
        // Arrange
        when(paperRepo.findById(1L)).thenReturn(Optional.of(testPaper));
        when(paperRepo.save(any(Paper.class))).thenReturn(testPaper);

        // Act
        submissionService.withdrawPaper(1L, 1L);

        // Assert
        assertEquals(PaperStatus.WITHDRAWN, testPaper.getStatus());
        verify(paperRepo).save(testPaper);
    }

    @Test
    void testWithdrawPaper_Unauthorized_ThrowsException() {
        // Arrange
        testPaper.getMainAuthor().setId(2L);
        when(paperRepo.findById(1L)).thenReturn(Optional.of(testPaper));

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> 
            submissionService.withdrawPaper(1L, 1L)
        );
    }
}

