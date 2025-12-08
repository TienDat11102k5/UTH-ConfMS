package edu.uth.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "roles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Role extends BaseEntity {
    
    @Column(unique = true, nullable = false)
    private String name; // Ví dụ: ROLE_ADMIN, ROLE_CHAIR, ROLE_AUTHOR
}