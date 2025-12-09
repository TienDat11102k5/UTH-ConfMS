package edu.uth.backend.auth;

import edu.uth.backend.entity.User;
import lombok.Data; 
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") 
public class AuthController {

    @Autowired
    private AuthService authService;

    // API: Đăng ký
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequestDTO req) {
        try {
            // Chuyển DTO sang Entity
            User userReq = new User();
            userReq.setEmail(req.getEmail());
            userReq.setFullName(req.getFullName());
            userReq.setAffiliation(req.getAffiliation());
            userReq.setPhoneNumber(req.getPhone());
            
            // Gọi Service
            User newUser = authService.register(userReq, req.getPassword());
            return ResponseEntity.ok(newUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API: Đăng nhập
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO req) {
        try {
            User user = authService.login(req.getEmail(), req.getPassword());
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // --- DTO Classes ---
    @Data 
    public static class LoginRequestDTO {
        private String email;
        private String password;
    }
    
    @Data 
    public static class RegisterRequestDTO {
        private String email;
        private String password;
        private String fullName;
        private String affiliation;
        private String phone;
    }
}