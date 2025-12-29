package edu.uth.backend.auth;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import edu.uth.backend.auth.dto.*;
import edu.uth.backend.common.MailService;
import edu.uth.backend.common.OtpUtil;
import edu.uth.backend.common.ResetTokenUtil;
import edu.uth.backend.common.RoleConstants;
import edu.uth.backend.entity.PasswordResetOtp;
import edu.uth.backend.entity.PasswordResetToken;
import edu.uth.backend.entity.Role;
import edu.uth.backend.entity.User;
import edu.uth.backend.history.UserActivityHistoryService;
import edu.uth.backend.repository.PasswordResetOtpRepository;
import edu.uth.backend.repository.PasswordResetTokenRepository;
import edu.uth.backend.repository.RoleRepository;
import edu.uth.backend.repository.UserRepository;
import edu.uth.backend.security.AuditLogger;
import edu.uth.backend.security.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;

/**
 * Service xử lý authentication & account flows
 * (register/login/google/fpwd/reset).
 * Ghi chú bằng tiếng Việt để dễ hiểu chức năng từng phương thức.
 */
@Service
public class AuthService {

  private final UserRepository userRepository;
  private final RoleRepository roleRepository;
  private final PasswordResetTokenRepository passwordResetTokenRepository;
  private final PasswordResetOtpRepository passwordResetOtpRepository;
  private final PasswordEncoder passwordEncoder;
  private final AuthenticationManager authenticationManager;
  private final JwtTokenProvider jwtTokenProvider;
  private final AuditLogger auditLogger;
  private final UserActivityHistoryService activityHistoryService;

  // Service gửi email qua SMTP (MailService phải được implement trong package
  // common)
  private final MailService mailService;

  /** Base URL frontend để tạo reset link (vd: http://localhost:5173) */
  @Value("${app.frontend.base-url:http://localhost:5173}")
  private String frontendBaseUrl;

  /** Thời hạn token reset (phút) */
  @Value("${app.reset-password.token-ttl-minutes:30}")
  private long resetTokenTtlMinutes;

  /** Thời hạn OTP (phút) */
  @Value("${app.reset-password.otp-ttl-minutes:5}")
  private long otpTtlMinutes;

  /** Tự động tạo Firebase user khi đăng ký LOCAL (true/false) */
  @Value("${app.auth.create-firebase-user:false}")
  private boolean createFirebaseUserOnRegister;

  public AuthService(
      UserRepository userRepository,
      RoleRepository roleRepository,
      PasswordResetTokenRepository passwordResetTokenRepository,
      PasswordResetOtpRepository passwordResetOtpRepository,
      PasswordEncoder passwordEncoder,
      AuthenticationManager authenticationManager,
      JwtTokenProvider jwtTokenProvider,
      MailService mailService,
      AuditLogger auditLogger,
      UserActivityHistoryService activityHistoryService) {
    this.userRepository = userRepository;
    this.roleRepository = roleRepository;
    this.passwordResetTokenRepository = passwordResetTokenRepository;
    this.passwordResetOtpRepository = passwordResetOtpRepository;
    this.passwordEncoder = passwordEncoder;
    this.authenticationManager = authenticationManager;
    this.jwtTokenProvider = jwtTokenProvider;
    this.mailService = mailService;
    this.auditLogger = auditLogger;
    this.activityHistoryService = activityHistoryService;
  }
  
  /**
   * Get client IP address from request
   */
  private String getClientIp() {
    try {
      ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
      if (attributes != null) {
        HttpServletRequest request = attributes.getRequest();
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
          return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
      }
    } catch (Exception e) {
      // Ignore
    }
    return "unknown";
  }

  /**
   * Đăng ký tài khoản LOCAL (mặc định ROLE_AUTHOR).
   * 
   * FLOW:
   * 1. Validate email chưa tồn tại
   * 2. Validate password strength (tối thiểu 6 ký tự)
   * 3. Tạo user trong database với password đã mã hóa
   * 4. Gán role ROLE_AUTHOR mặc định
   * 5. [TUỲ CHỌN] Tạo Firebase Authentication user nếu config bật
   * 6. Trả về JWT token
   * 
   * LƯU Ý:
   * - Email được chuẩn hóa (lowercase, trim)
   * - Password được mã hóa bằng BCrypt
   * - Provider = LOCAL (phân biệt với GOOGLE)
   * - Nếu tạo Firebase user thất bại, vẫn giữ user trong DB (vì đã validate
   * email)
   */
  @Transactional
  public AuthResponse register(RegisterRequest req) {
    // 1. Chuẩn hóa và validate email
    String email = req.getEmail().trim().toLowerCase();
    if (userRepository.existsByEmail(email)) {
      throw new IllegalArgumentException("Email đã tồn tại trong hệ thống");
    }

    // 2. Validate password (đã có @Size trong DTO nhưng kiểm tra thêm)
    if (req.getPassword() == null || req.getPassword().length() < 6) {
      throw new IllegalArgumentException("Mật khẩu phải có ít nhất 6 ký tự");
    }

    // 3. Validate fullName
    if (req.getFullName() == null || req.getFullName().trim().isEmpty()) {
      throw new IllegalArgumentException("Họ tên không được để trống");
    }

    // 4. Lấy hoặc tạo role AUTHOR
    Role authorRole = roleRepository.findByName(RoleConstants.ROLE_AUTHOR)
        .orElseGet(() -> roleRepository.save(new Role(RoleConstants.ROLE_AUTHOR)));

    // 5. Tạo user entity
    User u = new User();
    u.setEmail(email);
    u.setPasswordHash(passwordEncoder.encode(req.getPassword()));
    u.setFullName(req.getFullName().trim());
    u.setAffiliation(req.getAffiliation() != null ? req.getAffiliation().trim() : null);
    u.setProvider(User.AuthProvider.LOCAL);

    // 6. Gán roles
    if (u.getRoles() == null)
      u.setRoles(new HashSet<>());
    u.getRoles().add(authorRole);

    // 7. Lưu vào database
    User saved = userRepository.save(u);
    
    // 7.1 Audit log registration
    auditLogger.logRegistration(email, getClientIp());

    // 8. [TUỲ CHỌN] Tạo Firebase Authentication user (nếu config bật)
    if (createFirebaseUserOnRegister) {
      try {
        createFirebaseUser(email, req.getPassword(), req.getFullName());
        System.out.println("✅ Đã tạo Firebase Authentication user cho: " + email);
      } catch (Exception e) {
        // Log lỗi nhưng KHÔNG rollback transaction (user đã được lưu vào DB)
        System.err.println("⚠️ Tạo Firebase user thất bại cho " + email + ": " + e.getMessage());
        // Có thể gửi thông báo cho admin hoặc retry sau
      }
    }

    // 9. Trả về JWT token
    return buildAuthResponse(saved);
  }

  /**
   * Tạo user trong Firebase Authentication.
   * Sử dụng Firebase Admin SDK để tạo user với email/password.
   * 
   * LƯU Ý: Method này chỉ được gọi nếu config bật createFirebaseUserOnRegister.
   */
  private void createFirebaseUser(String email, String password, String displayName) throws Exception {
    try {
      var createRequest = new com.google.firebase.auth.UserRecord.CreateRequest()
          .setEmail(email)
          .setPassword(password)
          .setDisplayName(displayName)
          .setEmailVerified(false); // User cần verify email sau

      FirebaseAuth.getInstance().createUser(createRequest);
    } catch (com.google.firebase.auth.FirebaseAuthException e) {
      // Log chi tiết lỗi
      System.err.println("Tạo Firebase user thất bại: " + e.getMessage());
      throw e;
    }
  }

  /**
   * Đăng nhập LOCAL (email/password).
   * 
   * FLOW:
   * 1. Chuẩn hóa email (lowercase, trim)
   * 2. Authenticate bằng Spring Security AuthenticationManager
   * 3. Lấy user từ database
   * 4. Phát hành JWT token
   * 
   * LƯU Ý:
   * - AuthenticationManager tự động check password hash
   * - Nếu sai email/password -> throw BadCredentialsException
   * - Chỉ hỗ trợ user có provider = LOCAL
   */
  public AuthResponse login(LoginRequest req) {
    // 1. Chuẩn hóa email
    String email = req.getEmail().trim().toLowerCase();

    // 2. Kiểm tra user tồn tại và là LOCAL provider
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new IllegalArgumentException("Email hoặc mật khẩu không đúng"));

    // 3. Kiểm tra provider
    if (user.getProvider() != User.AuthProvider.LOCAL) {
      throw new IllegalArgumentException(
          "Tài khoản này đăng nhập bằng " + user.getProvider() + ". Vui lòng sử dụng phương thức đăng nhập tương ứng.");
    }

    // 4. Authenticate (Spring Security tự check password)
    try {
      authenticationManager.authenticate(
          new UsernamePasswordAuthenticationToken(email, req.getPassword()));
      
      // 4.1 Audit log successful login
      auditLogger.logLoginSuccess(email, getClientIp());
      
      // 4.2 Log to user activity history
      activityHistoryService.logActivity(
          user.getId(),
          edu.uth.backend.entity.ActivityType.LOGIN,
          edu.uth.backend.entity.EntityType.USER,
          user.getId(),
          "Đăng nhập thành công",
          activityHistoryService.createLoginMetadata(null, null),
          getClientIp()
      );
    } catch (Exception e) {
      // 4.3 Audit log failed login
      auditLogger.logLoginFailure(email, getClientIp(), e.getMessage());
      throw e;
    }

    // 5. Phát hành JWT
    return buildAuthResponse(user);
  }

  /**
   * Đăng nhập Google qua Firebase Authentication.
   * 
   * FLOW:
   * 1. Verify Firebase ID Token bằng Firebase Admin SDK
   * 2. Extract email, uid, name, picture từ token
   * 3. Tìm user trong database theo email:
   * - Nếu CHƯA TỒN TẠI: tạo user mới với provider GOOGLE
   * - Nếu ĐÃ TỒN TẠI:
   * + Provider = LOCAL: merge thành GOOGLE (user có thể dùng cả 2 cách)
   * + Provider = GOOGLE: cập nhật thông tin mới nhất
   * 4. Đảm bảo user có ít nhất role AUTHOR
   * 5. Phát hành JWT token
   * 
   * LƯU Ý:
   * - Firebase token được verify bởi Firebase Admin SDK (an toàn)
   * - Hỗ trợ merge account: user đăng ký LOCAL có thể đăng nhập Google sau
   * - Avatar và displayName được đồng bộ từ Google
   */
  @Transactional
  public AuthResponse loginWithFirebaseGoogle(FirebaseLoginRequest req) throws Exception {
    // 1. Verify Firebase ID Token
    FirebaseToken decoded;
    try {
      decoded = FirebaseAuth.getInstance().verifyIdToken(req.getIdToken());
    } catch (Exception e) {
      throw new IllegalArgumentException("Firebase token không hợp lệ: " + e.getMessage());
    }

    // 2. Extract thông tin từ token
    String email = decoded.getEmail();
    if (email == null || email.isBlank()) {
      throw new IllegalArgumentException("Firebase token không chứa email");
    }
    email = email.trim().toLowerCase();

    String uid = decoded.getUid();
    String name = (String) decoded.getClaims().getOrDefault("name", "");
    String picture = (String) decoded.getClaims().getOrDefault("picture", null);

    // 3. Lấy hoặc tạo role AUTHOR
    Role authorRole = roleRepository.findByName(RoleConstants.ROLE_AUTHOR)
        .orElseGet(() -> roleRepository.save(new Role(RoleConstants.ROLE_AUTHOR)));

    // 4. Tìm hoặc tạo user
    User user = userRepository.findByEmail(email).orElse(null);

    if (user == null) {
      // 4a. User chưa tồn tại -> tạo mới
      user = new User();
      user.setEmail(email);
      user.setProvider(User.AuthProvider.GOOGLE);
      user.setFirebaseUid(uid);
      user.setFullName(name != null && !name.isBlank() ? name : email.split("@")[0]);
      user.setAvatarUrl(picture);

      if (user.getRoles() == null)
        user.setRoles(new HashSet<>());
      user.getRoles().add(authorRole);

      user = userRepository.save(user);
      System.out.println("✅ Đã tạo người dùng GOOGLE mới: " + email);
      
      // Log login activity for new user
      activityHistoryService.logActivity(
          user.getId(),
          edu.uth.backend.entity.ActivityType.LOGIN,
          edu.uth.backend.entity.EntityType.USER,
          user.getId(),
          "Đăng nhập lần đầu qua Google",
          activityHistoryService.createLoginMetadata(null, null),
          getClientIp()
      );

    } else {
      // 4b. User đã tồn tại -> cập nhật thông tin

      // Merge account: cho phép user LOCAL đăng nhập bằng Google
      if (user.getProvider() == User.AuthProvider.LOCAL) {
        System.out.println("ℹ️ Gộp tài khoản LOCAL sang GOOGLE: " + email);
        user.setProvider(User.AuthProvider.GOOGLE);
      }

      // Cập nhật Firebase UID (quan trọng cho các tính năng Firebase khác)
      user.setFirebaseUid(uid);

      // Cập nhật fullName nếu chưa có hoặc rỗng
      if (user.getFullName() == null || user.getFullName().isBlank()) {
        user.setFullName(name != null && !name.isBlank() ? name : email.split("@")[0]);
      }

      // Cập nhật avatar nếu chưa có
      if (user.getAvatarUrl() == null || user.getAvatarUrl().isBlank()) {
        user.setAvatarUrl(picture);
      }

      // Đảm bảo có role
      if (user.getRoles() == null)
        user.setRoles(new HashSet<>());
      if (user.getRoles().isEmpty()) {
        user.getRoles().add(authorRole);
      }

      user = userRepository.save(user);
      System.out.println("✅ Đã cập nhật người dùng GOOGLE: " + email);
      
      // Log login activity
      activityHistoryService.logActivity(
          user.getId(),
          edu.uth.backend.entity.ActivityType.LOGIN,
          edu.uth.backend.entity.EntityType.USER,
          user.getId(),
          "Đăng nhập qua Google",
          activityHistoryService.createLoginMetadata(null, null),
          getClientIp()
      );
    }

    // 5. Phát hành JWT
    return buildAuthResponse(user);
  }

  /**
   * Quên mật khẩu (GỬI OTP QUA EMAIL):
   * - Controller luôn trả OK (chống dò email có tồn tại hay không)
   * - Nếu user tồn tại:
   * + Xoá OTP cũ của email (để chỉ còn 1 OTP hiệu lực)
   * + Tạo OTP 6 số, hash, expiresAt
   * + Lưu DB (chỉ lưu hash)
   * + Gửi email chứa OTP qua SMTP
   */
  @Transactional
  public void forgotPassword(ForgotPasswordRequest req) {
    String email = req.getEmail().trim().toLowerCase();

    User user = userRepository.findByEmail(email).orElse(null);
    if (user == null) {
      // Không lộ email có tồn tại hay không
      return;
    }

    // Xóa OTP cũ của email này
    passwordResetOtpRepository.deleteByEmail(email);

    // Tạo OTP 6 số
    String otp = OtpUtil.generateOtp();
    String otpHash = OtpUtil.sha256Hex(otp);

    Instant now = Instant.now();
    Instant expiresAt = now.plus(otpTtlMinutes, ChronoUnit.MINUTES);

    PasswordResetOtp otpEntity = PasswordResetOtp.builder()
        .email(email)
        .otpHash(otpHash)
        .createdAt(now)
        .expiresAt(expiresAt)
        .attemptCount(0)
        .build();

    passwordResetOtpRepository.save(otpEntity);

    // Gửi email chứa OTP
    try {
      mailService.sendOtpEmail(user.getEmail(), user.getFullName(), otp);
      System.out.println("✅ Đã gửi OTP đặt lại mật khẩu tới: " + email);
    } catch (Exception e) {
      System.err.println("⚠️ Gửi OTP tới " + email + " thất bại: " + e.getMessage());
      // Silent fail để không lộ email có tồn tại
    }
  }

  /**
   * Xác thực OTP:
   * - Nhận email và OTP từ user
   * - Hash OTP để tìm trong DB
   * - Kiểm tra: tồn tại + chưa verify + chưa hết hạn + số lần thử < 5
   * - Nếu OTP đúng: đánh dấu verified và tạo verified token
   * - Trả về verified token để dùng cho bước reset password
   */
  @Transactional
  public VerifyOtpResponse verifyOtp(VerifyOtpRequest req) {
    String email = req.getEmail().trim().toLowerCase();
    String otp = req.getOtp().trim();
    String otpHash = OtpUtil.sha256Hex(otp);

    PasswordResetOtp otpEntity = passwordResetOtpRepository
        .findByEmailAndVerifiedAtIsNull(email)
        .orElseThrow(() -> new IllegalArgumentException("OTP không tồn tại hoặc đã được sử dụng"));

    // Kiểm tra hết hạn
    if (otpEntity.getExpiresAt().isBefore(Instant.now())) {
      throw new IllegalArgumentException("OTP đã hết hạn. Vui lòng yêu cầu OTP mới");
    }

    // Kiểm tra số lần thử
    if (otpEntity.getAttemptCount() >= 5) {
      throw new IllegalArgumentException("Đã vượt quá số lần thử. Vui lòng yêu cầu OTP mới");
    }

    // Kiểm tra OTP
    if (!otpEntity.getOtpHash().equals(otpHash)) {
      otpEntity.setAttemptCount(otpEntity.getAttemptCount() + 1);
      passwordResetOtpRepository.save(otpEntity);
      int remainingAttempts = 5 - otpEntity.getAttemptCount();
      throw new IllegalArgumentException("OTP không đúng. Còn " + remainingAttempts + " lần thử");
    }

    // OTP đúng - đánh dấu đã verify
    otpEntity.setVerifiedAt(Instant.now());
    passwordResetOtpRepository.save(otpEntity);

    // Tạo verified token để dùng cho bước reset password
    String verifiedToken = ResetTokenUtil.generateRawToken();
    String tokenHash = ResetTokenUtil.sha256Hex(verifiedToken);

    // Lưu verified token vào bảng PasswordResetToken
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new IllegalArgumentException("User không tồn tại"));

    passwordResetTokenRepository.deleteByUser_Id(user.getId());

    PasswordResetToken token = PasswordResetToken.builder()
        .user(user)
        .tokenHash(tokenHash)
        .createdAt(Instant.now())
        .expiresAt(Instant.now().plus(resetTokenTtlMinutes, ChronoUnit.MINUTES))
        .build();

    passwordResetTokenRepository.save(token);

    return new VerifyOtpResponse(verifiedToken);
  }

  /**
   * Đặt lại mật khẩu:
   * - Nhận token thô từ user
   * - Hash token để tìm trong DB
   * - Kiểm tra: tồn tại + chưa dùng + chưa hết hạn
   * - Update passwordHash
   * - Mark usedAt để token không dùng lại được
   */
  @Transactional
  public void resetPassword(ResetPasswordRequest req) {
    String rawToken = req.getToken().trim();
    String tokenHash = ResetTokenUtil.sha256Hex(rawToken);

    PasswordResetToken token = passwordResetTokenRepository
        .findByTokenHashAndUsedAtIsNull(tokenHash)
        .orElseThrow(() -> new IllegalArgumentException("Token không hợp lệ hoặc đã dùng"));

    if (token.getExpiresAt().isBefore(Instant.now())) {
      throw new IllegalArgumentException("Token đã hết hạn");
    }

    User user = token.getUser();
    user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
    userRepository.save(user);

    token.setUsedAt(Instant.now());
    passwordResetTokenRepository.save(token);
  }

  /**
   * Build AuthResponse với JWT token và user info.
   * 
   * Chuẩn hóa role name:
   * - ROLE_AUTHOR -> AUTHOR
   * - ROLE_ADMIN -> ADMIN
   * - ROLE_REVIEWER -> REVIEWER
   * - ROLE_CHAIR -> CHAIR
   * 
   * Frontend sẽ dùng role này để routing và phân quyền UI.
   */
  private AuthResponse buildAuthResponse(User user) {
    // 1. Phát hành JWT token
    String token = jwtTokenProvider.generateToken(user);

    // 2. Build response
    AuthResponse res = new AuthResponse();
    res.setAccessToken(token);
    res.setExpiresInMs(jwtTokenProvider.getExpirationMs());

    // 3. Build user info
    AuthResponse.UserInfo ui = new AuthResponse.UserInfo();
    ui.id = user.getId();
    ui.email = user.getEmail();
    ui.fullName = user.getFullName() != null ? user.getFullName() : user.getEmail().split("@")[0];
    ui.avatarUrl = user.getAvatarUrl();
    ui.provider = user.getProvider() != null ? user.getProvider().name() : "LOCAL";

    // 4. Set primary role (chuẩn hoá: bỏ prefix "ROLE_")
    if (user.getRoles() != null && !user.getRoles().isEmpty()) {
      String roleName = user.getRoles().iterator().next().getName();
      if (roleName != null && roleName.startsWith("ROLE_")) {
        ui.role = roleName.substring("ROLE_".length()); // ROLE_AUTHOR -> AUTHOR
      } else {
        ui.role = roleName;
      }
    } else {
      ui.role = "AUTHOR"; // Default role nếu không có
    }

    res.setUser(ui);
    return res;
  }
}
