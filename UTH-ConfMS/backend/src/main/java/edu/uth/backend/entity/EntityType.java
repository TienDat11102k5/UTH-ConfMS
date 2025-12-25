package edu.uth.backend.entity;

/**
 * Enum định nghĩa loại đối tượng liên quan đến hoạt động
 */
public enum EntityType {
    PAPER("Bài viết"),
    REVIEW("Review"),
    USER("Người dùng"),
    CONFERENCE("Hội nghị"),
    NOTIFICATION("Thông báo"),
    PROCEEDINGS("Proceedings"),
    NONE("Không có");
    
    private final String displayName;
    
    EntityType(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}
