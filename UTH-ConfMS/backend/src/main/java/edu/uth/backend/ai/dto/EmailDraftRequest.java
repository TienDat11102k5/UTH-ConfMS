package edu.uth.backend.ai.dto;

import lombok.Data;

@Data
public class EmailDraftRequest {
    private String emailType; // ví dụ: "decision_accept", "decision_reject", "reminder"
    private String recipientName;
    private String paperTitle;
    private String conferenceName;
    private String decision; // dành cho email thông báo quyết định
    private String comments; // ngữ cảnh bổ sung tùy chọn
    private String language; // "en" (Tiếng Anh), "vi" (Tiếng Việt)
    private Long conferenceId;
}
