package edu.uth.backend.auth;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
// Cho phép Frontend (ở cổng 5173) gọi vào Backend (cổng 9090) mà không bị chặn
@CrossOrigin(origins = "*") 
public class AuthController {

    @GetMapping("/hello")
    public String hello() {
        // Đây là câu chào mà ông sẽ thấy trên web Frontend
        return "Backend (Java) trả lời: KẾT NỐI THÀNH CÔNG RỒI!";
    }
}