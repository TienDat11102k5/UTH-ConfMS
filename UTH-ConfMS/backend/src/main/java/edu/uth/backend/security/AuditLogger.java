package edu.uth.backend.security;

import edu.uth.backend.audit.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Audit Logger for security-sensitive operations
 * 
 * This component logs all security-related events including:
 * - Authentication attempts (success/failure)
 * - Authorization failures
 * - Role changes
 * - Password changes
 * - Sensitive data access
 * 
 * Logs are written to both file (via SLF4J) and database for compliance.
 * 
 * @author Security Team
 * @since 1.0.0
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AuditLogger {

    private static final DateTimeFormatter TIMESTAMP_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");
    
    private final AuditLogService auditLogService;

    /**
     * Log successful login
     */
    public void logLoginSuccess(String email, String ipAddress) {
        log.info("[AUDIT] LOGIN_SUCCESS | User: {} | IP: {} | Time: {}", 
            email, ipAddress, getCurrentTimestamp());
        auditLogService.log(email, "LOGIN_SUCCESS", null, ipAddress, null, null);
    }

    /**
     * Log failed login attempt
     */
    public void logLoginFailure(String email, String ipAddress, String reason) {
        log.warn("[AUDIT] LOGIN_FAILURE | User: {} | IP: {} | Reason: {} | Time: {}", 
            email, ipAddress, reason, getCurrentTimestamp());
        auditLogService.log(email, "LOGIN_FAILURE", null, ipAddress, reason, null);
    }

    /**
     * Log user registration
     */
    public void logRegistration(String email, String ipAddress) {
        log.info("[AUDIT] REGISTRATION | User: {} | IP: {} | Time: {}", 
            email, ipAddress, getCurrentTimestamp());
        auditLogService.log(email, "REGISTRATION", null, ipAddress, null, null);
    }

    /**
     * Log password change
     */
    public void logPasswordChange(String email, String ipAddress) {
        log.info("[AUDIT] PASSWORD_CHANGE | User: {} | IP: {} | Time: {}", 
            email, ipAddress, getCurrentTimestamp());
        auditLogService.log(email, "PASSWORD_CHANGE", null, ipAddress, null, null);
    }

    /**
     * Log password reset request
     */
    public void logPasswordResetRequest(String email, String ipAddress) {
        log.info("[AUDIT] PASSWORD_RESET_REQUEST | User: {} | IP: {} | Time: {}", 
            email, ipAddress, getCurrentTimestamp());
        auditLogService.log(email, "PASSWORD_RESET_REQUEST", null, ipAddress, null, null);
    }

    /**
     * Log password reset completion
     */
    public void logPasswordResetComplete(String email, String ipAddress) {
        log.info("[AUDIT] PASSWORD_RESET_COMPLETE | User: {} | IP: {} | Time: {}", 
            email, ipAddress, getCurrentTimestamp());
        auditLogService.log(email, "PASSWORD_RESET_COMPLETE", null, ipAddress, null, null);
    }

    /**
     * Log role change
     */
    public void logRoleChange(String targetUser, String oldRole, String newRole, String adminUser, String ipAddress) {
        log.info("[AUDIT] ROLE_CHANGE | Target: {} | OldRole: {} | NewRole: {} | Admin: {} | IP: {} | Time: {}", 
            targetUser, oldRole, newRole, adminUser, ipAddress, getCurrentTimestamp());
        String details = String.format("OldRole: %s, NewRole: %s, Admin: %s", oldRole, newRole, adminUser);
        auditLogService.log(targetUser, "ROLE_CHANGE", null, ipAddress, details, null);
    }

    /**
     * Log authorization failure
     */
    public void logAuthorizationFailure(String email, String endpoint, String requiredRole, String ipAddress) {
        log.warn("[AUDIT] AUTHORIZATION_FAILURE | User: {} | Endpoint: {} | RequiredRole: {} | IP: {} | Time: {}", 
            email, endpoint, requiredRole, ipAddress, getCurrentTimestamp());
        String details = String.format("Endpoint: %s, RequiredRole: %s", endpoint, requiredRole);
        auditLogService.log(email, "AUTHORIZATION_FAILURE", endpoint, ipAddress, details, null);
    }

    /**
     * Log conference creation
     */
    public void logConferenceCreation(String conferenceName, String createdBy, String ipAddress) {
        log.info("[AUDIT] CONFERENCE_CREATE | Name: {} | CreatedBy: {} | IP: {} | Time: {}", 
            conferenceName, createdBy, ipAddress, getCurrentTimestamp());
        auditLogService.log(createdBy, "CONFERENCE_CREATE", conferenceName, ipAddress, null, null);
    }

    /**
     * Log conference deletion
     */
    public void logConferenceDeletion(String conferenceName, String deletedBy, String ipAddress) {
        log.warn("[AUDIT] CONFERENCE_DELETE | Name: {} | DeletedBy: {} | IP: {} | Time: {}", 
            conferenceName, deletedBy, ipAddress, getCurrentTimestamp());
        auditLogService.log(deletedBy, "CONFERENCE_DELETE", conferenceName, ipAddress, null, null);
    }

    /**
     * Log paper submission
     */
    public void logPaperSubmission(Long paperId, String paperTitle, String author, String ipAddress) {
        log.info("[AUDIT] PAPER_SUBMIT | ID: {} | Title: {} | Author: {} | IP: {} | Time: {}", 
            paperId, paperTitle, author, ipAddress, getCurrentTimestamp());
        String target = String.format("Paper #%d: %s", paperId, paperTitle);
        auditLogService.log(author, "PAPER_SUBMIT", target, ipAddress, null, null);
    }

    /**
     * Log review submission
     */
    public void logReviewSubmission(Long reviewId, Long paperId, String reviewer, String ipAddress) {
        log.info("[AUDIT] REVIEW_SUBMIT | ReviewID: {} | PaperID: {} | Reviewer: {} | IP: {} | Time: {}", 
            reviewId, paperId, reviewer, ipAddress, getCurrentTimestamp());
        String target = String.format("Review #%d for Paper #%d", reviewId, paperId);
        auditLogService.log(reviewer, "REVIEW_SUBMIT", target, ipAddress, null, null);
    }

    /**
     * Log decision making
     */
    public void logDecision(Long paperId, String decision, String chair, String ipAddress) {
        log.info("[AUDIT] DECISION | PaperID: {} | Decision: {} | Chair: {} | IP: {} | Time: {}", 
            paperId, decision, chair, ipAddress, getCurrentTimestamp());
        String target = String.format("Paper #%d", paperId);
        auditLogService.log(chair, "DECISION", target, ipAddress, "Decision: " + decision, null);
    }

    /**
     * Log report access
     */
    public void logReportAccess(String reportType, Long conferenceId, String accessedBy, String ipAddress) {
        log.info("[AUDIT] REPORT_ACCESS | Type: {} | ConferenceID: {} | User: {} | IP: {} | Time: {}", 
            reportType, conferenceId, accessedBy, ipAddress, getCurrentTimestamp());
    }

    /**
     * Log file upload
     */
    public void logFileUpload(String fileName, Long fileSize, String uploadedBy, String ipAddress) {
        log.info("[AUDIT] FILE_UPLOAD | Name: {} | Size: {}KB | UploadedBy: {} | IP: {} | Time: {}", 
            fileName, fileSize / 1024, uploadedBy, ipAddress, getCurrentTimestamp());
    }

    /**
     * Log suspicious activity
     */
    public void logSuspiciousActivity(String activity, String user, String ipAddress, String details) {
        log.error("[AUDIT] SUSPICIOUS_ACTIVITY | Activity: {} | User: {} | IP: {} | Details: {} | Time: {}", 
            activity, user, ipAddress, details, getCurrentTimestamp());
    }

    /**
     * Log security configuration change
     */
    public void logSecurityConfigChange(String setting, String oldValue, String newValue, String changedBy, String ipAddress) {
        log.warn("[AUDIT] CONFIG_CHANGE | Setting: {} | Old: {} | New: {} | ChangedBy: {} | IP: {} | Time: {}", 
            setting, oldValue, newValue, changedBy, ipAddress, getCurrentTimestamp());
    }

    /**
     * Log API rate limit exceeded
     */
    public void logRateLimitExceeded(String endpoint, String user, String ipAddress) {
        log.warn("[AUDIT] RATE_LIMIT_EXCEEDED | Endpoint: {} | User: {} | IP: {} | Time: {}", 
            endpoint, user, ipAddress, getCurrentTimestamp());
    }

    /**
     * Log session expiration
     */
    public void logSessionExpired(String email, String sessionId) {
        log.info("[AUDIT] SESSION_EXPIRED | User: {} | SessionID: {} | Time: {}", 
            email, sessionId, getCurrentTimestamp());
    }

    /**
     * Log token refresh
     */
    public void logTokenRefresh(String email, String ipAddress) {
        log.info("[AUDIT] TOKEN_REFRESH | User: {} | IP: {} | Time: {}", 
            email, ipAddress, getCurrentTimestamp());
    }

    /**
     * Log invalid token attempt
     */
    public void logInvalidToken(String token, String ipAddress) {
        log.warn("[AUDIT] INVALID_TOKEN | Token: {}... | IP: {} | Time: {}", 
            token != null && token.length() > 20 ? token.substring(0, 20) : "null", 
            ipAddress, getCurrentTimestamp());
    }

    /**
     * Log data export
     */
    public void logDataExport(String dataType, String exportedBy, String ipAddress) {
        log.info("[AUDIT] DATA_EXPORT | Type: {} | ExportedBy: {} | IP: {} | Time: {}", 
            dataType, exportedBy, ipAddress, getCurrentTimestamp());
    }

    /**
     * Get current timestamp as formatted string
     */
    private String getCurrentTimestamp() {
        return LocalDateTime.now().format(TIMESTAMP_FORMAT);
    }
}
