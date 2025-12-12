package edu.uth.backend.auth;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import edu.uth.backend.auth.dto.*;
import edu.uth.backend.common.ResetTokenUtil;
import edu.uth.backend.common.RoleConstants;
import edu.uth.backend.entity.PasswordResetToken;
import edu.uth.backend.entity.Role;
import edu.uth.backend.entity.User;
import edu.uth.backend.repository.PasswordResetTokenRepository;
import edu.uth.backend.repository.RoleRepository;
import edu.uth.backend.repository.UserRepository;
import edu.uth.backend.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;

@Service
public class AuthService {

  private final UserRepository userRepository;
  private final RoleRepository roleRepository;
  private final PasswordResetTokenRepository passwordResetTokenRepository;
  private final PasswordEncoder passwordEncoder;
  private final AuthenticationManager authenticationManager;
  private final JwtTokenProvider jwtTokenProvider;

  /** Base URL frontend để tạo reset link (dùng log/email) */
  @Value("${app.frontend.base-url:http://localhost:5173}")
  private String frontendBaseUrl;

  /** Thời hạn token reset (phút) */
  @Value("${app.reset-password.token-ttl-minutes:30}")
  private long resetTokenTtlMinutes;

  public AuthService(
      UserRepository userRepository,
      RoleRepository roleRepository,
      PasswordResetTokenRepository passwordResetTokenRepository,
      PasswordEncoder passwordEncoder,
      AuthenticationManager authenticationManager,
      JwtTokenProvider jwtTokenProvider
  ) {
    this.userRepository = userRepository;
    this.roleRepository = roleRepository;
    this.passwordResetTokenRepository = passwordResetTokenRepository;
    this.passwordEncoder = passwordEncoder;
    this.authenticationManager = authenticationManager;
    this.jwtTokenProvider = jwtTokenProvider;
  }

  /**
   * Đăng ký tài khoản LOCAL (mặc định ROLE_AUTHOR).
   * - Kiểm tra trùng email
   * - Mã hoá mật khẩu
   * - Tạo user provider LOCAL
   */
  public AuthResponse register(RegisterRequest req) {
    String email = req.getEmail().trim().toLowerCase();
    if (userRepository.existsByEmail(email)) {
      throw new IllegalArgumentException("Email already exists");
    }

    Role authorRole = roleRepository.findByName(RoleConstants.ROLE_AUTHOR)
        .orElseGet(() -> roleRepository.save(new Role(RoleConstants.ROLE_AUTHOR)));

    User u = new User();
    u.setEmail(email);
    u.setPasswordHash(passwordEncoder.encode(req.getPassword()));
    u.setFullName(req.getFullName());
    u.setAffiliation(req.getAffiliation());
    u.setProvider(User.AuthProvider.LOCAL);

    // đảm bảo roles không null (tránh NPE nếu entity chưa init)
    if (u.getRoles() == null) u.setRoles(new HashSet<>());
    u.getRoles().add(authorRole);

    User saved = userRepository.save(u);
    return buildAuthResponse(saved);
  }

  /**
   * Đăng nhập LOCAL:
   * - Dùng AuthenticationManager để check email/password
   * - Nếu đúng -> phát hành JWT bằng JwtTokenProvider
   */
  public AuthResponse login(LoginRequest req) {
    String email = req.getEmail().trim().toLowerCase();

    authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(email, req.getPassword())
    );

    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));

    return buildAuthResponse(user);
  }

  /**
   * Đăng nhập Google qua Firebase:
   * - Verify idToken bằng Firebase Admin SDK
   * - Nếu user chưa tồn tại -> tạo mới (provider GOOGLE, firebaseUid, avatar, name)
   * - Nếu đã tồn tại -> đồng bộ firebaseUid/provider/avatar/name (nếu thiếu)
   * - Phát hành JWT của backend
   */
  public AuthResponse loginWithFirebaseGoogle(FirebaseLoginRequest req) throws Exception {
    FirebaseToken decoded = FirebaseAuth.getInstance().verifyIdToken(req.getIdToken());

    String email = decoded.getEmail();
    if (email == null || email.isBlank()) {
      throw new IllegalArgumentException("Firebase token has no email");
    }
    email = email.trim().toLowerCase();

    String uid = decoded.getUid();
    String name = (String) decoded.getClaims().getOrDefault("name", null);
    String picture = (String) decoded.getClaims().getOrDefault("picture", null);

    Role authorRole = roleRepository.findByName(RoleConstants.ROLE_AUTHOR)
        .orElseGet(() -> roleRepository.save(new Role(RoleConstants.ROLE_AUTHOR)));

    User user = userRepository.findByEmail(email).orElse(null);
    if (user == null) {
      user = new User();
      user.setEmail(email);
      user.setProvider(User.AuthProvider.GOOGLE);
      user.setFirebaseUid(uid);
      user.setFullName(name);
      user.setAvatarUrl(picture);

      if (user.getRoles() == null) user.setRoles(new HashSet<>());
      user.getRoles().add(authorRole);

      user = userRepository.save(user);
    } else {
      if (user.getProvider() != User.AuthProvider.GOOGLE) {
        user.setProvider(User.AuthProvider.GOOGLE);
      }
      user.setFirebaseUid(uid);

      if (user.getFullName() == null || user.getFullName().isBlank()) user.setFullName(name);
      if (user.getAvatarUrl() == null || user.getAvatarUrl().isBlank()) user.setAvatarUrl(picture);

      if (user.getRoles() == null) user.setRoles(new HashSet<>());
      // nếu user chưa có role nào thì gán ROLE_AUTHOR mặc định
      if (user.getRoles().isEmpty()) user.getRoles().add(authorRole);

      user = userRepository.save(user);
    }

    return buildAuthResponse(user);
  }

  /**
   * Quên mật khẩu:
   * - Luôn trả OK ở Controller (tránh lộ email có tồn tại hay không)
   * - Nếu user tồn tại:
   *    + Xoá token cũ của user (để chỉ còn 1 token hiệu lực)
   *    + Tạo rawToken, hash, expiresAt
   *    + Lưu DB (chỉ lưu hash)
   *    + Log reset link (bạn thay bằng gửi email thật sau)
   */
  @Transactional
  public void forgotPassword(ForgotPasswordRequest req) {
    String email = req.getEmail().trim().toLowerCase();

    User user = userRepository.findByEmail(email).orElse(null);
    if (user == null) {
      // Không lộ email có tồn tại hay không
      return;
    }

    // Giữ 1 token active cho mỗi user (đơn giản để demo)
    passwordResetTokenRepository.deleteByUser_Id(user.getId());

    String rawToken = ResetTokenUtil.generateRawToken();
    String tokenHash = ResetTokenUtil.sha256Hex(rawToken);

    Instant now = Instant.now();
    Instant expiresAt = now.plus(resetTokenTtlMinutes, ChronoUnit.MINUTES);

    PasswordResetToken token = PasswordResetToken.builder()
        .user(user)
        .tokenHash(tokenHash)
        .createdAt(now)
        .expiresAt(expiresAt)
        .usedAt(null)
        .build();

    passwordResetTokenRepository.save(token);

    // TODO: gửi email thật. Tạm thời log để test.
    String resetLink = frontendBaseUrl + "/reset-password?token=" + rawToken;
    System.out.println("🔐 Reset password link for " + email + ": " + resetLink);
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
   * Build response đăng nhập:
   * - Phát hành accessToken JWT
   * - Trả user info cơ bản
   * - role trả về dạng không có prefix "ROLE_" để frontend route dễ hơn (AUTHOR/ADMIN/...)
   */
  private AuthResponse buildAuthResponse(User user) {
    String token = jwtTokenProvider.generateToken(user);

    AuthResponse res = new AuthResponse();
    res.setAccessToken(token);
    res.setExpiresInMs(jwtTokenProvider.getExpirationMs());

    AuthResponse.UserInfo ui = new AuthResponse.UserInfo();
    ui.id = user.getId();
    ui.email = user.getEmail();
    ui.fullName = user.getFullName();
    ui.avatarUrl = user.getAvatarUrl();
    ui.provider = user.getProvider() != null ? user.getProvider().name() : "UNKNOWN";

    // Set primary role (chuẩn hoá ROLE_AUTHOR -> AUTHOR)
    if (user.getRoles() != null && !user.getRoles().isEmpty()) {
      String roleName = user.getRoles().iterator().next().getName();
      if (roleName != null && roleName.startsWith("ROLE_")) {
        ui.role = roleName.substring("ROLE_".length());
      } else {
        ui.role = roleName;
      }
    }

    res.setUser(ui);
    return res;
  }
}
