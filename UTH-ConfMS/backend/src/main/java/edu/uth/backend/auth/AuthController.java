package edu.uth.backend.auth;

import edu.uth.backend.auth.dto.*;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/register")
  public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
    log.info("POST /api/auth/register - email={}", req.getEmail());

    AuthResponse response = authService.register(req);

    log.info("Register success - userId={}", response.getUser().id);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @PostMapping("/login")
  public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
    log.info("POST /api/auth/login - email={}", req.getEmail());

    AuthResponse response = authService.login(req);

    log.info("Login success - userId={}", response.getUser().id);
    return ResponseEntity.ok(response);
  }

  @PostMapping("/firebase/google")
  public ResponseEntity<AuthResponse> firebaseGoogle(@Valid @RequestBody FirebaseLoginRequest req) throws Exception {
    log.info("POST /api/auth/firebase/google");

    AuthResponse response = authService.loginWithFirebaseGoogle(req);

    log.info("Firebase login success - userId={}", response.getUser().id);
    return ResponseEntity.ok(response);
  }

  @PostMapping("/google")
  public ResponseEntity<AuthResponse> google(@Valid @RequestBody FirebaseLoginRequest req) throws Exception {
    log.info("POST /api/auth/google");

    AuthResponse response = authService.loginWithFirebaseGoogle(req);

    log.info("Google login success - userId={}", response.getUser().id);
    return ResponseEntity.ok(response);
  }

  @PostMapping("/forgot-password")
  public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
    log.info("POST /api/auth/forgot-password - email={}", req.getEmail());

    authService.forgotPassword(req);

    log.info("Forgot password request processed");
    return ResponseEntity.ok(new MessageResponse(
        "Nếu email tồn tại trong hệ thống, mã OTP sẽ được gửi đến email của bạn."));
  }

  @PostMapping("/verify-otp")
  public ResponseEntity<VerifyOtpResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest req) {
    log.info("POST /api/auth/verify-otp - email={}", req.getEmail());

    VerifyOtpResponse response = authService.verifyOtp(req);

    log.info("OTP verified successfully");
    return ResponseEntity.ok(response);
  }

  @PostMapping("/reset-password")
  public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
    log.info("POST /api/auth/reset-password");

    authService.resetPassword(req);

    log.info("Password reset successfully");
    return ResponseEntity.ok(new MessageResponse(
        "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới."));
  }
}
