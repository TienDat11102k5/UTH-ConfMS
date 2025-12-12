package edu.uth.backend.auth;

import edu.uth.backend.auth.dto.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Auth APIs:
 * - /register
 * - /login
 * - /firebase/google (login Google bằng Firebase idToken)
 * - /forgot-password (tạo token reset)
 * - /reset-password (đặt lại mật khẩu bằng token)
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/register")
  public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
    return ResponseEntity.ok(authService.register(req));
  }

  @PostMapping("/login")
  public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
    return ResponseEntity.ok(authService.login(req));
  }

  @PostMapping("/firebase/google")
  public ResponseEntity<AuthResponse> firebaseGoogle(@Valid @RequestBody FirebaseLoginRequest req) throws Exception {
    return ResponseEntity.ok(authService.loginWithFirebaseGoogle(req));
  }

  // Alias endpoint for compatibility
  @PostMapping("/google")
  public ResponseEntity<AuthResponse> google(@Valid @RequestBody FirebaseLoginRequest req) throws Exception {
    return ResponseEntity.ok(authService.loginWithFirebaseGoogle(req));
  }

  /**
   * Quên mật khẩu:
   * - Không trả lỗi nếu email không tồn tại (chống dò email)
   * - Backend sẽ log reset link (hoặc gửi email nếu bạn tích hợp mail service)
   */
  @PostMapping("/forgot-password")
  public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
    authService.forgotPassword(req);
    return ResponseEntity.ok(new MessageResponse(
        "Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu sẽ được gửi."
    ));
  }

  /**
   * Đặt lại mật khẩu bằng token:
   * - Frontend gửi token + newPassword
   * - Backend kiểm tra token và cập nhật passwordHash
   */
  @PostMapping("/reset-password")
  public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
    authService.resetPassword(req);
    return ResponseEntity.ok(new MessageResponse("Đặt lại mật khẩu thành công."));
  }
}
