package edu.uth.backend.notification;

import edu.uth.backend.ai.AIProxyService;
import edu.uth.backend.ai.dto.EmailDraftRequest;
import edu.uth.backend.ai.dto.EmailDraftResponse;
import edu.uth.backend.common.MailService;
import edu.uth.backend.entity.EmailDraft;
import edu.uth.backend.entity.User;
import edu.uth.backend.repository.EmailDraftRepository;
import edu.uth.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class EmailDraftService {

    private static final Logger logger = LoggerFactory.getLogger(EmailDraftService.class);

    @Autowired
    private EmailDraftRepository draftRepository;

    @Autowired
    private AIProxyService aiProxyService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MailService mailService;

    @Transactional
    public EmailDraft generateDraft(
            EmailDraft.EmailType emailType,
            Long paperId,
            String decision,
            Long conferenceId,
            Long recipientId,
            Map<String, Object> additionalData) {
        try {
            EmailDraftRequest request = new EmailDraftRequest();
            request.setEmailType(emailType.name().toLowerCase());
            request.setConferenceId(conferenceId);
            request.setLanguage("vi"); // Mặc định là tiếng Việt theo logic trước đó

            if (paperId != null) {
                request.setPaperTitle((String) additionalData.get("paper_title"));
                request.setRecipientName((String) additionalData.get("author_name"));
                request.setDecision(decision);
                request.setComments((String) additionalData.get("reviews_summary"));
            }

            if (emailType == EmailDraft.EmailType.REVIEWER_REMINDER) {
                request.setRecipientName((String) additionalData.get("reviewer_name"));
                request.setComments("Nhắc nhở về các bài báo chưa review: " + additionalData.get("pending_papers"));
            }

            EmailDraftResponse response = aiProxyService.draftEmail(request, null, conferenceId);

            EmailDraft draft = new EmailDraft();
            draft.setConferenceId(conferenceId);
            draft.setEmailType(emailType);
            draft.setRecipientId(recipientId);
            draft.setSubject(response.getSubject());
            draft.setBody(response.getBody());
            draft.setBody(response.getBody());
            draft.setTemplateType("html"); // Giả sử là HTML
            // Lưu phản hồi thô hoặc đơn giản hóa
            draft.setPersonalization("{}"); // Placeholder hoặc trích xuất từ phản hồi nếu cần
            draft.setGeneratedAt(LocalDateTime.now());
            draft.setStatus(EmailDraft.DraftStatus.DRAFT);
            draft.setPaperId(paperId);

            EmailDraft saved = draftRepository.save(draft);
            logger.info("Đã tạo bản nháp email: {} cho bài {}", emailType, paperId);

            return saved;

        } catch (Exception e) {
            logger.error("Lỗi tạo bản nháp email", e);
            throw new RuntimeException("Tạo bản nháp email thất bại: " + e.getMessage(), e);
        }
    }

    @Transactional
    public EmailDraft saveDraft(EmailDraft draft) {
        return draftRepository.save(draft);
    }

    @Transactional
    public EmailDraft approveDraft(Long draftId, String editedSubject, String editedBody, Long approvedBy) {
        EmailDraft draft = draftRepository.findById(draftId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bản nháp email: " + draftId));

        if (editedSubject != null) {
            draft.setEditedSubject(editedSubject);
        }
        if (editedBody != null) {
            draft.setEditedBody(editedBody);
        }

        draft.setApprovedAt(LocalDateTime.now());
        draft.setApprovedBy(approvedBy);
        draft.setStatus(EmailDraft.DraftStatus.APPROVED);

        EmailDraft saved = draftRepository.save(draft);
        logger.info("Bản nháp email {} đã được phê duyệt bởi người dùng {}", draftId, approvedBy);

        return saved;
    }

    @Transactional
    public boolean sendApprovedEmail(Long draftId) {
        EmailDraft draft = draftRepository.findById(draftId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bản nháp email: " + draftId));

        if (draft.getStatus() != EmailDraft.DraftStatus.APPROVED) {
            throw new RuntimeException("Bản nháp email phải được phê duyệt trước khi gửi");
        }

        Long recipientId = draft.getRecipientId();
        if (recipientId == null) {
            throw new RuntimeException("Bản nháp email không có recipientId để gửi");
        }

        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new RuntimeException("User người nhận không tồn tại: " + recipientId));

        String to = recipient.getEmail();
        if (to == null || to.isBlank()) {
            throw new RuntimeException("Email người nhận trống (userId=" + recipientId + ")");
        }

        String subject = (draft.getEditedSubject() != null && !draft.getEditedSubject().isBlank())
                ? draft.getEditedSubject()
                : draft.getSubject();
        String body = (draft.getEditedBody() != null && !draft.getEditedBody().isBlank())
                ? draft.getEditedBody()
                : draft.getBody();

        boolean looksLikeHtml = (draft.getTemplateType() != null
                && draft.getTemplateType().toLowerCase().contains("html"))
                || (body != null && body.contains("<") && body.contains(">"));

        boolean sent;
        if (looksLikeHtml) {
            sent = mailService.trySendHtmlEmail(to, subject, body, body);
        } else {
            sent = mailService.trySendSimpleEmail(to, subject, body);
        }

        if (!sent) {
            logger.warn("Gửi email draft {} thất bại (to={})", draftId, to);
            return false;
        }

        draft.setSentAt(LocalDateTime.now());
        draft.setStatus(EmailDraft.DraftStatus.SENT);
        draftRepository.save(draft);

        logger.info("Đã gửi email draft {} tới {}", draftId, to);
        return true;
    }

    public List<EmailDraft> getDraftsByConference(Long conferenceId) {
        return draftRepository.findByConferenceId(conferenceId);
    }

    public List<EmailDraft> getDraftsByStatus(Long conferenceId, EmailDraft.DraftStatus status) {
        return draftRepository.findByConferenceIdAndStatus(conferenceId, status);
    }
}
