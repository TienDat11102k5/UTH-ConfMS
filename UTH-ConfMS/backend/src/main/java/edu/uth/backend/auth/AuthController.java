package edu.uth.backend.auth;
import edu.uth.backend.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // Cho phép ReactJS gọi API
public class AuthController {

    @Autowired
    private AuthService authService;

    // API: Đăng ký tài khoản
    // POST: /api/auth/register
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequestDTO req) {
        try {
            // Chuyển đổi DTO sang Entity (Hoặc sửa Service nhận DTO)
            User userReq = new User();
            userReq.setEmail(req.getEmail());
            userReq.setFullName(req.getFullName());
            userReq.setAffiliation(req.getAffiliation());
            userReq.setPhoneNumber(req.getPhone());
            
            // Gọi Service (Lưu ý: Service bạn sửa lại nhận User và String password)
            User newUser = authService.register(userReq, req.getPassword());
            return ResponseEntity.ok(newUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API: Đăng nhập
    // POST: /api/auth/login
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO req) {
        try {
            User user = authService.login(req.getEmail(), req.getPassword());
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // --- DTO Classes (Để nhận dữ liệu JSON) ---
    public static class LoginRequestDTO {
        private String email;
        private String password;
        // Getters & Setters
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }
    
    public static class RegisterRequestDTO {
        private String email;
        private String password;
        private String fullName;
        private String affiliation;
        private String phone;
        // Getters & Setters... (Bạn tự generate nhé cho gọn)
        public String getEmail() { return email; }
        public String getPassword() { return password; }
        public String getFullName() { return fullName; }
        public String getAffiliation() { return affiliation; }
        public String getPhone() { return phone; }
    }
}