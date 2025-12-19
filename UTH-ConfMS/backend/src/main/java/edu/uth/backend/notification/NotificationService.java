package edu.uth.backend.notification;

import edu.uth.backend.entity.PaperStatus;
import edu.uth.backend.common.MailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private MailService mailService;

    // Hàm gửi email thông báo kết quả (Decision)
    public void sendDecisionEmail(String toEmail, String fullName, String paperTitle, PaperStatus decision) {
        String subject = "Thông báo kết quả bài báo: " + paperTitle;
        String htmlBody = buildDecisionEmailHtml(fullName, paperTitle, decision);
        String textBody = buildDecisionEmailText(fullName, paperTitle, decision);
        
        mailService.trySendHtmlEmail(toEmail, subject, htmlBody, textBody);
    }

    // Bulk email - gửi email cho nhiều tác giả
    public int sendBulkDecisionEmails(List<DecisionEmailData> emailDataList) {
        int successCount = 0;
        for (DecisionEmailData data : emailDataList) {
            try {
                sendDecisionEmail(data.getEmail(), data.getFullName(), data.getPaperTitle(), data.getDecision());
                successCount++;
            } catch (Exception e) {
                System.err.println("Lỗi gửi email cho " + data.getEmail() + ": " + e.getMessage());
            }
        }
        return successCount;
    }

    private String buildDecisionEmailHtml(String fullName, String paperTitle, PaperStatus decision) {
        String displayName = fullName == null || fullName.isBlank() ? "Tác giả" : fullName;
        String decisionText = decision == PaperStatus.ACCEPTED ? "ĐƯỢC CHẤP NHẬN" : "KHÔNG ĐƯỢC CHẤP NHẬN";
        String decisionColor = decision == PaperStatus.ACCEPTED ? "#2e7d32" : "#d32f2f";
        String nextStep = decision == PaperStatus.ACCEPTED 
            ? "Xin vui lòng chuẩn bị nộp bản hoàn thiện (Camera-ready) theo hướng dẫn của ban tổ chức."
            : "Rất tiếc, bài báo chưa phù hợp với tiêu chí hội nghị lần này. Chúng tôi cảm ơn bạn đã tham gia.";
        
        return String.format("""
            <!doctype html>
            <html><head><meta charset="utf-8"/></head><body>
            <div style="font-family:Arial,Helvetica,sans-serif;max-width:680px;margin:16px auto;padding:20px;">
                <h3 style="color:#0f62fe;">UTH-ConfMS - Thông báo kết quả</h3>
                <p>Kính gửi %s,</p>
                <p>Ban tổ chức xin thông báo kết quả đánh giá cho bài báo của bạn:</p>
                <div style="background:#f5f5f5;padding:15px;border-radius:8px;margin:20px 0;">
                    <p style="margin:0;font-weight:bold;">Tiêu đề bài báo:</p>
                    <p style="margin:5px 0 15px 0;">%s</p>
                    <p style="margin:0;font-weight:bold;">Kết quả:</p>
                    <p style="margin:5px 0;color:%s;font-weight:bold;font-size:1.1em;">%s</p>
                </div>
                <p>%s</p>
                <p>Trân trọng,<br/>Ban tổ chức UTH-ConfMS</p>
            </div></body></html>
            """, displayName, paperTitle, decisionColor, decisionText, nextStep);
    }

    private String buildDecisionEmailText(String fullName, String paperTitle, PaperStatus decision) {
        String displayName = fullName == null || fullName.isBlank() ? "Tác giả" : fullName;
        String decisionText = decision == PaperStatus.ACCEPTED ? "ĐƯỢC CHẤP NHẬN" : "KHÔNG ĐƯỢC CHẤP NHẬN";
        String nextStep = decision == PaperStatus.ACCEPTED 
            ? "Xin vui lòng chuẩn bị nộp bản hoàn thiện (Camera-ready)."
            : "Rất tiếc, bài báo chưa phù hợp với tiêu chí hội nghị lần này.";
        
        return String.format("""
            Kính gửi %s,
            
            Ban tổ chức xin thông báo kết quả đánh giá cho bài báo của bạn:
            
            Tiêu đề: %s
            Kết quả: %s
            
            %s
            
            Trân trọng,
            Ban tổ chức UTH-ConfMS
            """, displayName, paperTitle, decisionText, nextStep);
    }

    // Inner class để chứa dữ liệu email
    public static class DecisionEmailData {
        private String email;
        private String fullName;
        private String paperTitle;
        private PaperStatus decision;

        public DecisionEmailData(String email, String fullName, String paperTitle, PaperStatus decision) {
            this.email = email;
            this.fullName = fullName;
            this.paperTitle = paperTitle;
            this.decision = decision;
        }

        public String getEmail() { return email; }
        public String getFullName() { return fullName; }
        public String getPaperTitle() { return paperTitle; }
        public PaperStatus getDecision() { return decision; }
    }
}