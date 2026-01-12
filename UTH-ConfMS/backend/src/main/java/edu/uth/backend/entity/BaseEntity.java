package edu.uth.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@MappedSuperclass
@Getter
@Setter
public abstract class BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        // Đảm bảo createdAt được set theo timezone Vietnam
        if (createdAt == null) {
            createdAt = edu.uth.backend.util.DateTimeUtil.nowVietnam();
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        // Đảm bảo updatedAt được set theo timezone Vietnam
        updatedAt = edu.uth.backend.util.DateTimeUtil.nowVietnam();
    }
}