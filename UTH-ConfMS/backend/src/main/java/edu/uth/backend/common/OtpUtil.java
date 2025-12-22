package edu.uth.backend.common;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;

/**
 * Tiện ích tạo OTP 6 số và hash OTP để lưu DB an toàn.
 * - OTP thô (6 số) chỉ gửi cho user qua email.
 * - DB chỉ lưu SHA-256(OTP) để tránh lộ OTP nếu DB bị đọc.
 */
public final class OtpUtil {

  private static final SecureRandom RNG = new SecureRandom();

  private OtpUtil() {}

  /** Tạo OTP 6 số ngẫu nhiên */
  public static String generateOtp() {
    int otp = 100000 + RNG.nextInt(900000);
    return String.valueOf(otp);
  }

  /** Hash SHA-256 → hex 64 ký tự */
  public static String sha256Hex(String otp) {
    try {
      MessageDigest md = MessageDigest.getInstance("SHA-256");
      byte[] digest = md.digest(otp.getBytes(StandardCharsets.UTF_8));
      StringBuilder sb = new StringBuilder(digest.length * 2);
      for (byte b : digest) sb.append("%02x".formatted(b));
      return sb.toString();
    } catch (Exception e) {
      throw new IllegalStateException("Không thể hash OTP", e);
    }
  }
}
