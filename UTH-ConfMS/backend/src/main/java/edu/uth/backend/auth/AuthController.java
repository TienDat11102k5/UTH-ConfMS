package edu.uth.backend.auth;

import edu.uth.backend.auth.dto.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}
