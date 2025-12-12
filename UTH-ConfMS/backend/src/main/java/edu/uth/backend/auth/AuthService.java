package edu.uth.backend.auth;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import edu.uth.backend.auth.dto.*;
import edu.uth.backend.common.RoleConstants;
import edu.uth.backend.entity.Role;
import edu.uth.backend.entity.User;
import edu.uth.backend.repository.RoleRepository;
import edu.uth.backend.repository.UserRepository;
import edu.uth.backend.security.JwtTokenProvider;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

  private final UserRepository userRepository;
  private final RoleRepository roleRepository;
  private final PasswordEncoder passwordEncoder;
  private final AuthenticationManager authenticationManager;
  private final JwtTokenProvider jwtTokenProvider;

  public AuthService(
      UserRepository userRepository,
      RoleRepository roleRepository,
      PasswordEncoder passwordEncoder,
      AuthenticationManager authenticationManager,
      JwtTokenProvider jwtTokenProvider
  ) {
    this.userRepository = userRepository;
    this.roleRepository = roleRepository;
    this.passwordEncoder = passwordEncoder;
    this.authenticationManager = authenticationManager;
    this.jwtTokenProvider = jwtTokenProvider;
  }

  public AuthResponse register(RegisterRequest req) {
    if (userRepository.existsByEmail(req.getEmail())) {
      throw new IllegalArgumentException("Email already exists");
    }

    Role authorRole = roleRepository.findByName(RoleConstants.ROLE_AUTHOR)
        .orElseGet(() -> roleRepository.save(new Role(RoleConstants.ROLE_AUTHOR)));

    User u = new User();
    u.setEmail(req.getEmail().toLowerCase());
    u.setPasswordHash(passwordEncoder.encode(req.getPassword()));
    u.setFullName(req.getFullName());
    u.setProvider(User.AuthProvider.LOCAL);
    u.getRoles().add(authorRole);

    User saved = userRepository.save(u);
    return buildAuthResponse(saved);
  }

  public AuthResponse login(LoginRequest req) {
    Authentication auth = authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(req.getEmail().toLowerCase(), req.getPassword())
    );
    // Nếu authenticate ok thì user tồn tại
    User user = userRepository.findByEmail(req.getEmail().toLowerCase())
        .orElseThrow(() -> new IllegalArgumentException("User not found"));
    return buildAuthResponse(user);
  }

  public AuthResponse loginWithFirebaseGoogle(FirebaseLoginRequest req) throws Exception {
    FirebaseToken decoded = FirebaseAuth.getInstance().verifyIdToken(req.getIdToken());

    String email = decoded.getEmail();
    if (email == null || email.isBlank()) {
      throw new IllegalArgumentException("Firebase token has no email");
    }

    String uid = decoded.getUid();
    String name = (String) decoded.getClaims().getOrDefault("name", null);
    String picture = (String) decoded.getClaims().getOrDefault("picture", null);

    Role authorRole = roleRepository.findByName(RoleConstants.ROLE_AUTHOR)
        .orElseGet(() -> roleRepository.save(new Role(RoleConstants.ROLE_AUTHOR)));

    User user = userRepository.findByEmail(email.toLowerCase()).orElse(null);
    if (user == null) {
      user = new User();
      user.setEmail(email.toLowerCase());
      user.setProvider(User.AuthProvider.GOOGLE);
      user.setFirebaseUid(uid);
      user.setFullName(name);
      user.setAvatarUrl(picture);
      user.getRoles().add(authorRole);
      user = userRepository.save(user);
    } else {
      // đồng bộ provider/firebaseUid nếu user đã tồn tại
      if (user.getProvider() != User.AuthProvider.GOOGLE) {
        user.setProvider(User.AuthProvider.GOOGLE);
      }
      user.setFirebaseUid(uid);
      if (user.getFullName() == null || user.getFullName().isBlank()) user.setFullName(name);
      if (user.getAvatarUrl() == null || user.getAvatarUrl().isBlank()) user.setAvatarUrl(picture);
      user = userRepository.save(user);
    }

    return buildAuthResponse(user);
  }

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
    ui.provider = user.getProvider().name();
    res.setUser(ui);

    return res;
  }
}
