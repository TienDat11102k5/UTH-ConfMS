package edu.uth.backend.email;

import edu.uth.backend.entity.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import lombok.extern.slf4j.Slf4j;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${app.mail.from}")
    private String fromEmail;

    @Value("${app.email.enabled:true}")
    private boolean emailEnabled;

    @Value("${app.frontend.base-url}")
    private String frontendBaseUrl;

    private static final DateTimeFormatter DATE_FORMATTER = 
        DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    public EmailService(JavaMailSender mailSender, TemplateEngine templateEngine) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
    }

    /**
     * 1. Gửi email thông báo phân công review
     */
    @Async
    public void sendAssignmentNotification(ReviewAssignment assignment) {
        if (!emailEnabled) {
            log.info("Email disabled, skipping assignment notification");
            return;
        }

        try {
            Context context = new Context();
            context.setVariable("reviewerName", assignment.getReviewer().getFullName());
            context.setVariable("paperTitle", assignment.getPaper().getTitle());
            context.setVariable("conferenceName", assignment.getPaper().getTrack().getConference().getName());
            context.setVariable("deadline", assignment.getDueDate() != null 
                ? assignment.getDueDate().format(DATE_FORMATTER) 
                : "Chưa xác định");
            context.setVariable("reviewLink", frontendBaseUrl + "/reviewer/review/" + assignment.getId());

            String htmlContent = templateEngine.process("email/assignment-notification", context);
            
            sendEmail(
                assignment.getReviewer().getEmail(),
                "Thông báo phân công review bài báo - " + assignment.getPaper().getTitle(),
                htmlContent
            );

            log.info("Sent assignment notification to {}", assignment.getReviewer().getEmail());
        } catch (Exception e) {
            log.error("Failed to send assignment notification", e);
        }
    }

    /**
     * 2. Gửi email thông báo review đã được nộp (cho Chair)
     */
    @Async
    public void sendReviewSubmittedNotification(Review review) {
        if (!emailEnabled) return;

        try {
            User chair = review.getAssignment().getPaper().getTrack().getConference().getOrganizer();
            if (chair == null || chair.getEmail() == null) {
                log.warn("No chair email found for review notification");
                return;
            }

            Context context = new Context();
            context.setVariable("chairName", chair.getFullName());
            context.setVariable("reviewerName", review.getAssignment().getReviewer().getFullName());
            context.setVariable("paperTitle", review.getAssignment().getPaper().getTitle());
            context.setVariable("score", review.getScore());
            context.setVariable("confidenceLevel", review.getConfidenceLevel());
            context.setVariable("viewLink", frontendBaseUrl + "/chair/progress");

            String htmlContent = templateEngine.process("email/review-submitted", context);
            
            sendEmail(
                chair.getEmail(),
                "Review mới đã được nộp - " + review.getAssignment().getPaper().getTitle(),
                htmlContent
            );

            log.info("Sent review submitted notification to chair {}", chair.getEmail());
        } catch (Exception e) {
            log.error("Failed to send review submitted notification", e);
        }
    }

    /**
     * 3. Gửi email thông báo quyết định (Accept/Reject)
     */
    @Async
    public void sendDecisionNotification(Paper paper, String decision) {
        if (!emailEnabled) return;

        try {
            String template = decision.equalsIgnoreCase("ACCEPTED") 
                ? "email/decision-accept" 
                : "email/decision-reject";

            Context context = new Context();
            context.setVariable("authorName", paper.getMainAuthor().getFullName());
            context.setVariable("paperTitle", paper.getTitle());
            context.setVariable("conferenceName", paper.getTrack().getConference().getName());
            context.setVariable("decision", decision);
            
            if (decision.equalsIgnoreCase("ACCEPTED")) {
                context.setVariable("cameraReadyDeadline", 
                    paper.getTrack().getConference().getCameraReadyDeadline() != null
                        ? paper.getTrack().getConference().getCameraReadyDeadline().format(DATE_FORMATTER)
                        : "Sẽ thông báo sau");
                context.setVariable("uploadLink", frontendBaseUrl + "/author/submissions/" + paper.getId() + "/camera-ready");
            }

            String htmlContent = templateEngine.process(template, context);
            
            sendEmail(
                paper.getMainAuthor().getEmail(),
                "Thông báo kết quả review - " + paper.getTitle(),
                htmlContent
            );

            log.info("Sent decision notification ({}) to {}", decision, paper.getMainAuthor().getEmail());
        } catch (Exception e) {
            log.error("Failed to send decision notification", e);
        }
    }

    /**
     * 4. Gửi email nhắc nhở upload camera-ready
     */
    @Async
    public void sendCameraReadyReminderNotification(Paper paper) {
        if (!emailEnabled) return;

        try {
            Context context = new Context();
            context.setVariable("authorName", paper.getMainAuthor().getFullName());
            context.setVariable("paperTitle", paper.getTitle());
            context.setVariable("conferenceName", paper.getTrack().getConference().getName());
            context.setVariable("deadline", 
                paper.getTrack().getConference().getCameraReadyDeadline() != null
                    ? paper.getTrack().getConference().getCameraReadyDeadline().format(DATE_FORMATTER)
                    : "Chưa xác định");
            context.setVariable("uploadLink", frontendBaseUrl + "/author/submissions/" + paper.getId() + "/camera-ready");

            String htmlContent = templateEngine.process("email/camera-ready-reminder", context);
            
            sendEmail(
                paper.getMainAuthor().getEmail(),
                "Nhắc nhở: Upload bản camera-ready - " + paper.getTitle(),
                htmlContent
            );

            log.info("Sent camera-ready reminder to {}", paper.getMainAuthor().getEmail());
        } catch (Exception e) {
            log.error("Failed to send camera-ready reminder", e);
        }
    }

    /**
     * 5. Gửi hàng loạt email quyết định
     */
    public void sendBulkDecisionNotifications(List<Paper> papers) {
        if (!emailEnabled) {
            log.info("Email disabled, skipping bulk notifications");
            return;
        }

        log.info("Sending bulk decision notifications for {} papers", papers.size());
        
        for (Paper paper : papers) {
            try {
                sendDecisionNotification(paper, paper.getStatus().name());
            } catch (Exception e) {
                log.error("Failed to send decision notification for paper {}", paper.getId(), e);
                // Continue with other emails
            }
        }

        log.info("Completed bulk decision notifications");
    }

    /**
     * Private method để gửi email
     */
    private void sendEmail(String to, String subject, String htmlContent) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);

        mailSender.send(message);
        log.debug("Email sent to {} with subject: {}", to, subject);
    }
}
