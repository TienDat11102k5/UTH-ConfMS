package edu.uth.backend.auth;

import edu.uth.backend.common.RoleConstants; 
import edu.uth.backend.entity.*;
import edu.uth.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.HashSet; // <--- Import HashSet
import java.util.Set;

@Service
public class AuthService {
    @Autowired private UserRepository userRepo;
    @Autowired private RoleRepository roleRepo;
    @Autowired private PasswordEncoder passwordEncoder;

    // Đăng ký tài khoản
    public User register(User user, String rawPassword) { // Nhận thẳng User đã map từ Controller
        // 1. Validate
        if (user.getEmail() == null || user.getEmail().isEmpty()) {
            throw new RuntimeException("Email không được để trống!");
        }
        if (userRepo.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email '" + user.getEmail() + "' đã được sử dụng!");
        }

        // 2. Mã hóa mật khẩu & Thiết lập cơ bản
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setActive(true); // Nếu bên User dùng Boolean, chỗ này vẫn hiểu là true

        // 3. Gán quyền mặc định (QUAN TRỌNG: Dùng HashSet để sau này còn thêm quyền được)
        Set<Role> roles = new HashSet<>();
        Role authorRole = roleRepo.findByName(RoleConstants.AUTHOR) // Dùng Constant
                .orElseThrow(() -> new RuntimeException("Lỗi hệ thống: Không tìm thấy Role AUTHOR."));
        roles.add(authorRole);
        
        user.setRoles(roles);

        return userRepo.save(user);
    }

    // Đăng nhập
    public User login(String email, String rawPassword) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại!"));
        
        // Gọi hàm isActive() thủ công mà bạn đã thêm vào Entity User
        if (!user.isActive()) {
            throw new RuntimeException("Tài khoản đã bị khóa!");
        }
        
        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new RuntimeException("Sai mật khẩu!");
        }
        return user;
    }
}