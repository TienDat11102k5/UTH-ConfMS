package edu.uth.backend.notification;

import edu.uth.backend.entity.PaperStatus;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    // Hàm gửi email thông báo kết quả (Decision)
    public void sendDecisionEmail(String toEmail, String fullName, String paperTitle, PaperStatus decision) {
        // Logic giả lập gửi email (Mock)
        System.out.println("==================================================================");
        System.out.println("[MOCK EMAIL SERVICE] SENDING DECISION NOTIFICATION...");
        System.out.println("------------------------------------------------------------------");
        System.out.println("TO      : " + toEmail + " (" + fullName + ")");
        System.out.println("SUBJECT : Thông báo kết quả bài báo: " + paperTitle);
        System.out.println("CONTENT :");
        System.out.println("   Kính gửi tác giả " + fullName + ",");
        System.out.println("   Ban tổ chức xin thông báo bài báo của bạn đã có kết quả: " + decision);
        
        if (decision == PaperStatus.ACCEPTED) {
            System.out.println("   -> Xin vui lòng chuẩn bị nộp bản hoàn thiện (Camera-ready).");
        } else {
            System.out.println("   -> Rất tiếc, bài báo chưa phù hợp với tiêu chí hội nghị lần này.");
        }
        
        System.out.println("   Trân trọng,");
        System.out.println("   Ban tổ chức UTH-ConfMS.");
        System.out.println("==================================================================");
    }
}