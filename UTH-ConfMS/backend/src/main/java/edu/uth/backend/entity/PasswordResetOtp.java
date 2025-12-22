package edu.uth.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Bảng lưu OTP reset mật khẩu.
 * - email: email của user (không dùng FK để hỗ trợ silent fail)
 * - otpHash: SHA-256(OTP 6 số)
 * - expiresAt: hết hạn (mặc định 5 phút)
 * - verifiedAt: đã xác thực (null = chưa verify)
 * - attemptCount: số lần thử sai (max 5)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
    name = "password_reset_otps",
    indexes = {
        @Index(name = "idx_pro_email", columnList = "email"),
        @Index(name = "idx_pro_otp_hash", columnList = "otpHash")
    }
)
public class PasswordResetOtp {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 255)
  private String email;

  @Column(nullable = false, length = 64)
  private String otpHash;

  @Column(nullable = false)
  private Instant createdAt;

  @Column(nullable = false)
  private Instant expiresAt;

  private Instant verifiedAt;

  @Column(nullable = false)
  @Builder.Default
  private Integer attemptCount = 0;
}
