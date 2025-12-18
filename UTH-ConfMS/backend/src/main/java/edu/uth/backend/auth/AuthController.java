package edu.uth.backend.auth;

import edu.uth.backend.auth.dto.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Auth REST API Controller
 * 
 * ENDPOINTS:
 * - POST /api/auth/register         : Đăng ký tài khoản LOCAL (email/password)
 * - POST /api/auth/login            : Đăng nhập LOCAL (email/password)
 * - POST /api/auth/firebase/google  : Đăng nhập Google qua Firebase (idToken)
 * - POST /api/auth/google           : Alias cho firebase/google (compatibility)
 * - POST /api/auth/forgot-password  : Yêu cầu reset mật khẩu (gửi email)
 * - POST /api/auth/reset-password   : Đặt lại mật khẩu bằng token
 * 
 * ERROR HANDLING:
 * - IllegalArgumentException -> 400 Bad Request
 * - AuthenticationException -> 401 Không được phép
 * - Exception -> 500 Lỗi máy chủ
 * 
 * SECURITY:
 * - Tất cả endpoints đều public (không cần authentication)
 * - Validate input bằng @Valid annotations
 * - Rate limiting nên được implement ở API Gateway
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  /**
   * Đăng ký tài khoản LOCAL mới.
   * 
   * REQUEST BODY (RegisterRequest):
   * - email: Email hợp lệ (unique)
   * - password: Mật khẩu (min 6 ký tự)
   * - fullName: Họ tên (required)
   * - affiliation: Đơn vị (optional)
   * 
   * RESPONSE (AuthResponse):
   * - accessToken: JWT token để authenticate
   * - expiresInMs: Thời hạn token (milliseconds)
   * - user: Thông tin user (id, email, fullName, role, ...)
   * 
   * ERRORS:
   * - 400: Email đã tồn tại, password yếu, fullName trống
   * - 500: Lỗi server (database, Firebase, ...)
   */
  @PostMapping("/register")
  public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
    AuthResponse response = authService.register(req);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  /**
   * Đăng nhập bằng email/password (LOCAL).
   * 
   * REQUEST BODY (LoginRequest):
   * - email: Email đã đăng ký
   * - password: Mật khẩu
   * 
   * RESPONSE (AuthResponse):
   * - accessToken: JWT token
   * - expiresInMs: Thời hạn token
   * - user: Thông tin user
   * 
   * ERRORS:
   * - 400: Email/password sai, account không phải LOCAL
  * - 401: Xác thực thất bại
   */
  @PostMapping("/login")
  public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
    return ResponseEntity.ok(authService.login(req));
  }

  /**
   * Đăng nhập Google qua Firebase Authentication.
   * 
   * FLOW:
   * 1. Frontend login Google qua Firebase SDK
   * 2. Frontend gửi idToken lên backend
   * 3. Backend verify token bằng Firebase Admin SDK
   * 4. Backend tạo/update user và phát hành JWT
   * 
   * REQUEST BODY (FirebaseLoginRequest):
   * - idToken: Firebase ID Token từ Google Sign-In
   * 
   * RESPONSE (AuthResponse):
   * - accessToken: Backend JWT token
   * - user: Thông tin user (merge từ Google)
   * 
   * ERRORS:
   * - 400: Token không hợp lệ, không có email
  * - 500: Xác minh Firebase thất bại
   */
  @PostMapping("/firebase/google")
  public ResponseEntity<AuthResponse> firebaseGoogle(@Valid @RequestBody FirebaseLoginRequest req) throws Exception {
    return ResponseEntity.ok(authService.loginWithFirebaseGoogle(req));
  }

  /**
   * Alias endpoint cho /firebase/google (backward compatibility).
   */
  @PostMapping("/google")
  public ResponseEntity<AuthResponse> google(@Valid @RequestBody FirebaseLoginRequest req) throws Exception {
    return ResponseEntity.ok(authService.loginWithFirebaseGoogle(req));
  }

  /**
   * Quên mật khẩu - Yêu cầu reset link.
   * 
   * SECURITY:
   * - Luôn trả về success message (không tiết lộ email có tồn tại hay không)
   * - Chống brute force: implement rate limiting
   * - Token chỉ dùng được 1 lần và có thời hạn (mặc định 30 phút)
   * 
   * REQUEST BODY (ForgotPasswordRequest):
   * - email: Email cần reset password
   * 
   * RESPONSE (MessageResponse):
   * - message: "Nếu email tồn tại, hướng dẫn đã được gửi"
   * 
   * BACKEND ACTION:
   * - Nếu email tồn tại: tạo token, gửi email với reset link
   * - Nếu email không tồn tại: silent fail (không làm gì)
   */
  @PostMapping("/forgot-password")
  public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
    authService.forgotPassword(req);
    return ResponseEntity.ok(new MessageResponse(
        "Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu sẽ được gửi đến email của bạn."
    ));
  }

  /**
   * Đặt lại mật khẩu bằng token từ email.
   * 
   * FLOW:
   * 1. User nhận email với reset link: /reset-password?token=xxx
   * 2. Frontend parse token từ URL
   * 3. Frontend gửi token + newPassword lên backend
   * 4. Backend validate token và update password
   * 
   * REQUEST BODY (ResetPasswordRequest):
   * - token: Token từ email (raw token, not hashed)
   * - newPassword: Mật khẩu mới (min 6 ký tự)
   * 
   * RESPONSE (MessageResponse):
   * - message: "Đặt lại mật khẩu thành công"
   * 
   * ERRORS:
   * - 400: Token không hợp lệ, đã dùng, hoặc hết hạn
   * - 400: Password yếu (< 6 ký tự)
   */
  @PostMapping("/reset-password")
  public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
    authService.resetPassword(req);
    return ResponseEntity.ok(new MessageResponse(
        "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới."
    ));
  }
}
