package edu.uth.backend.common;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Tiện ích tạo token reset mật khẩu và hash token để lưu DB an toàn.
 * - Token thô (raw token) chỉ gửi cho user (qua email / log để test).
 * - DB chỉ lưu SHA-256(token) để tránh lộ token nếu DB bị đọc.
 */
public final class ResetTokenUtil {

  private static final SecureRandom RNG = new SecureRandom();

  private ResetTokenUtil() {}

  /** Tạo token dạng URL-safe (không padding) */
  public static String generateRawToken() {
    byte[] bytes = new byte[32];
    RNG.nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }

  /** Hash SHA-256 -> hex 64 ký tự */
  public static String sha256Hex(String raw) {
    try {
      MessageDigest md = MessageDigest.getInstance("SHA-256");
      byte[] digest = md.digest(raw.getBytes(StandardCharsets.UTF_8));
      StringBuilder sb = new StringBuilder(digest.length * 2);
      for (byte b : digest) sb.append(String.format("%02x", b));
      return sb.toString();
    } catch (Exception e) {
      throw new IllegalStateException("Không thể hash token", e);
    }
  }
}
