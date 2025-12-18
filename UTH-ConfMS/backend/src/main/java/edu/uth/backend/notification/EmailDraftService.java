package edu.uth.backend.notification;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.uth.backend.ai.AIProxyService;
import edu.uth.backend.entity.EmailDraft;
import edu.uth.backend.repository.EmailDraftRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Dịch vụ Bản Nháp Email
 * Xử lý tạo bản nháp email do AI sinh, phê duyệt và gửi.
 */
@Service
public class EmailDraftService {

    private static final Logger logger = LoggerFactory.getLogger(EmailDraftService.class);
    
    @Autowired
    private EmailDraftRepository draftRepository;
    
    @Autowired
    private AIProxyService aiProxyService;
    
    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Tạo bản nháp email bằng dịch vụ AI.
     *
     * @param emailType Loại email
     * @param paperId ID bài báo (cho email quyết định)
     * @param decision Quyết định (accept/reject)
     * @param conferenceId ID hội nghị
     * @param recipientId ID người nhận
     * @param additionalData Dữ liệu bổ sung để tạo email
     * @return Thực thể EmailDraft
     */
    @Transactional
    public EmailDraft generateDraft(
            EmailDraft.EmailType emailType,
            Long paperId,
            String decision,
            Long conferenceId,
            Long recipientId,
            Map<String, Object> additionalData
    ) {
        try {
            // Chuẩn bị yêu cầu cho dịch vụ AI
            Map<String, Object> request = new HashMap<>();
            request.put("email_type", emailType.name().toLowerCase());
            request.put("conference_id", conferenceId.toString());
            
            if (paperId != null) {
                request.put("paper_id", paperId.toString());
                request.put("paper_title", additionalData.get("paper_title"));
                request.put("author_name", additionalData.get("author_name"));
                request.put("decision", decision);
                request.put("reviews_summary", additionalData.get("reviews_summary"));
            }
            
            if (emailType == EmailDraft.EmailType.REVIEWER_REMINDER) {
                request.put("reviewer_id", recipientId.toString());
                request.put("reviewer_name", additionalData.get("reviewer_name"));
                request.put("pending_papers", additionalData.get("pending_papers"));
            }
            
            // Gọi dịch vụ AI
            @SuppressWarnings("unchecked")
            Map<String, Object> response = (Map<String, Object>) aiProxyService.callAIService(
                    "/api/v1/chairs/draft-email",
                    request,
                    Map.class
            );
            
            // Tạo thực thể bản nháp
            EmailDraft draft = new EmailDraft();
            draft.setConferenceId(conferenceId);
            draft.setEmailType(emailType);
            draft.setRecipientId(recipientId);
            draft.setSubject((String) response.get("subject"));
            draft.setBody((String) response.get("body"));
            draft.setTemplateType((String) response.get("template_type"));
            draft.setPersonalization(objectMapper.writeValueAsString(response.get("personalization")));
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

    /**
     * Lưu bản nháp (tạo mới hoặc cập nhật).
     */
    @Transactional
    public EmailDraft saveDraft(EmailDraft draft) {
        return draftRepository.save(draft);
    }

    /**
     * Phê duyệt bản nháp email (sau khi chủ tọa xem xét và chỉnh sửa).
     *
     * @param draftId ID bản nháp
     * @param editedSubject Tiêu đề đã chỉnh sửa (tùy chọn)
     * @param editedBody Nội dung đã chỉnh sửa (tùy chọn)
     * @param approvedBy ID người dùng (chủ tọa) phê duyệt
     * @return Bản nháp đã được phê duyệt
     */
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

    /**
     * Gửi email đã được phê duyệt.
     * Lưu ý: Việc gửi email thực tế nên được triển khai bằng `MailService`.
     *
     * @param draftId ID bản nháp
     * @return true nếu gửi thành công
     */
    @Transactional
    public boolean sendApprovedEmail(Long draftId) {
        EmailDraft draft = draftRepository.findById(draftId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bản nháp email: " + draftId));
        
        if (draft.getStatus() != EmailDraft.DraftStatus.APPROVED) {
            throw new RuntimeException("Bản nháp email phải được phê duyệt trước khi gửi");
        }

        // TODO: Triển khai gửi email thực tế bằng MailService
        // Hiện tại tạm thời, chỉ đánh dấu là đã gửi
        draft.setSentAt(LocalDateTime.now());
        draft.setStatus(EmailDraft.DraftStatus.SENT);
        draftRepository.save(draft);
        
        logger.info("Bản nháp email {} đã được đánh dấu là đã gửi", draftId);
        return true;
    }

    /**
     * Lấy các bản nháp cho một hội nghị.
     */
    public List<EmailDraft> getDraftsByConference(Long conferenceId) {
        return draftRepository.findByConferenceId(conferenceId);
    }

    /**
     * Lấy các bản nháp theo trạng thái.
     */
    public List<EmailDraft> getDraftsByStatus(Long conferenceId, EmailDraft.DraftStatus status) {
        return draftRepository.findByConferenceIdAndStatus(conferenceId, status);
    }
}

