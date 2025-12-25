package edu.uth.backend.entity;

/**
 * Enum định nghĩa các loại hoạt động của người dùng
 */
public enum ActivityType {
    // Paper Management
    SUBMIT_PAPER("Nộp bài mới"),
    EDIT_PAPER("Chỉnh sửa bài"),
    WITHDRAW_PAPER("Rút bài"),
    UPLOAD_CAMERA_READY("Upload camera-ready"),
    
    // Review Activities
    VIEW_REVIEW("Xem review"),
    SUBMIT_REVIEW("Gửi review"),
    UPDATE_REVIEW("Cập nhật review"),
    
    // Authentication & User
    LOGIN("Đăng nhập"),
    LOGOUT("Đăng xuất"),
    UPDATE_PROFILE("Cập nhật profile"),
    CHANGE_PASSWORD("Thay đổi mật khẩu"),
    
    // Other Activities
    REGISTER_CONFERENCE("Đăng ký conference"),
    DOWNLOAD_PROCEEDINGS("Tải proceedings"),
    VIEW_NOTIFICATION("Xem thông báo");
    
    private final String displayName;
    
    ActivityType(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}
