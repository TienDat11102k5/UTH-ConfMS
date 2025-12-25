package edu.uth.backend.entity;

/**
 * Enum định nghĩa trạng thái của hoạt động
 */
public enum ActivityStatus {
    SUCCESS("Thành công"),
    FAILED("Thất bại");
    
    private final String displayName;
    
    ActivityStatus(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}
