package edu.uth.backend.conference;

import edu.uth.backend.entity.Conference;

import edu.uth.backend.entity.User;

import edu.uth.backend.repository.ConferenceRepository;
import edu.uth.backend.repository.TrackRepository;
import edu.uth.backend.repository.UserRepository;
import edu.uth.backend.security.AuditLogger;
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
 * Unit Tests cho ConferenceService
 * Test các chức năng: Create Conference, Update Conference, Get Conferences
 */
@ExtendWith(MockitoExtension.class)
class ConferenceServiceTest {

    @Mock
    private ConferenceRepository conferenceRepo;

    @Mock
    private UserRepository userRepo;

    @Mock
    private TrackRepository trackRepo;

    @Mock
    private AuditLogger auditLogger;

    @InjectMocks
    private ConferenceService conferenceService;

    private User testOrganizer;
    private Conference testConference;

    @BeforeEach
    void setUp() {
        // Setup test organizer
        testOrganizer = new User();
        testOrganizer.setId(1L);
        testOrganizer.setEmail("chair@example.com");
        testOrganizer.setFullName("Test Chair");

        // Setup test conference
        testConference = new Conference();
        testConference.setId(1L);
        testConference.setName("International Conference on AI 2025");
        testConference.setDescription("A premier conference on AI");
        testConference.setStartDate(LocalDateTime.now().plusMonths(6));
        testConference.setEndDate(LocalDateTime.now().plusMonths(6).plusDays(3));
        testConference.setSubmissionDeadline(LocalDateTime.now().plusMonths(3));
        testConference.setReviewDeadline(LocalDateTime.now().plusMonths(4));
        testConference.setCameraReadyDeadline(LocalDateTime.now().plusMonths(5));
        testConference.setOrganizer(testOrganizer);
        testConference.setIsHidden(false);
        testConference.setIsLocked(false);
    }

    // ==================== CREATE CONFERENCE TESTS ====================

    @Test
    void testCreateConference_Success() {
        // Arrange
        when(conferenceRepo.save(any(Conference.class))).thenReturn(testConference);

        // Act
        Conference result = conferenceService.createConference(testConference);

        // Assert
        assertNotNull(result);
        assertEquals("International Conference on AI 2025", result.getName());
        assertEquals(testOrganizer, result.getOrganizer());
        assertFalse(result.getIsHidden());
        assertFalse(result.getIsLocked());
        verify(conferenceRepo).save(any(Conference.class));
    }

    @Test
    void testCreateConference_InvalidDates_ThrowsException() {
        // Arrange
        Conference invalidConf = new Conference();
        invalidConf.setName("Test");
        invalidConf.setDescription("Desc");
        invalidConf.setStartDate(LocalDateTime.now().plusMonths(6));
        invalidConf.setEndDate(LocalDateTime.now().plusMonths(5)); // End before start

        // Act & Assert
        RuntimeException exception = assertThrows(
            RuntimeException.class,
            () -> conferenceService.createConference(invalidConf)
        );
        assertTrue(exception.getMessage().contains("Ngày kết thúc phải sau ngày bắt đầu"));
    }

    // ==================== UPDATE CONFERENCE TESTS ====================

    @Test
    void testUpdateConference_Success() {
        // Arrange
        when(conferenceRepo.findById(1L)).thenReturn(Optional.of(testConference));
        when(conferenceRepo.save(any(Conference.class))).thenReturn(testConference);

        // Act
        Conference result = conferenceService.updateConference(1L, testConference);

        // Assert
        assertNotNull(result);
        verify(conferenceRepo).save(any(Conference.class));
    }

    @Test
    void testUpdateConference_NotFound_ThrowsException() {
        // Arrange
        when(conferenceRepo.findById(999L)).thenReturn(Optional.empty());
        
        Conference updateConf = new Conference();
        updateConf.setName("Updated Name");
        updateConf.setDescription("Updated description");

        // Act & Assert
        assertThrows(
            RuntimeException.class,
            () -> conferenceService.updateConference(999L, updateConf)
        );
    }

    // ==================== GET CONFERENCES TESTS ====================

    @Test
    void testGetAllConferences_Success() {
        // Arrange
        List<Conference> mockConferences = new ArrayList<>();
        mockConferences.add(testConference);

        when(conferenceRepo.findAll()).thenReturn(mockConferences);

        // Act
        List<Conference> result = conferenceService.getAllConferences();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        verify(conferenceRepo).findAll();
    }

    @Test
    void testGetConferenceById_Found() {
        // Arrange
        when(conferenceRepo.findById(1L)).thenReturn(Optional.of(testConference));

        // Act
        Conference result = conferenceService.getConferenceById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("International Conference on AI 2025", result.getName());
    }

    @Test
    void testGetConferenceById_NotFound_ThrowsException() {
        // Arrange
        when(conferenceRepo.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(
            RuntimeException.class,
            () -> conferenceService.getConferenceById(999L)
        );
    }
}
