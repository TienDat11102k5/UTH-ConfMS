package edu.uth.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Bảng lưu token reset mật khẩu.
 * - tokenHash: SHA-256(token thô)
 * - expiresAt: hết hạn
 * - usedAt: đã dùng (null = chưa dùng)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
    name = "password_reset_tokens",
    indexes = {
        @Index(name = "idx_prt_token_hash", columnList = "tokenHash", unique = true),
        @Index(name = "idx_prt_user_id", columnList = "user_id")
    }
)
public class PasswordResetToken {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true, length = 64)
  private String tokenHash;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Column(nullable = false)
  private Instant expiresAt;

  private Instant usedAt;

  @Column(nullable = false)
  private Instant createdAt;
}
