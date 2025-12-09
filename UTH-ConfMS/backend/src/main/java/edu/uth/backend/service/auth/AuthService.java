package edu.uth.backend.auth;

import edu.uth.backend.entity.*;
import edu.uth.backend.entity.user.Role;
import edu.uth.backend.entity.user.User;
import edu.uth.backend.repository.*;
import edu.uth.backend.repository.user.RoleRepository;
import edu.uth.backend.repository.user.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Set;

@Service
public class AuthService {
    @Autowired private UserRepository userRepo;
    @Autowired private RoleRepository roleRepo;
    @Autowired private PasswordEncoder passwordEncoder;

    // Đăng ký tài khoản
    public User register(User req, String rawPassword) { // Note: Đã điều chỉnh tham số để nhận User entity hoặc DTO
        // 1. Validate dữ liệu đầu vào
        if (req.getEmail() == null || req.getEmail().isEmpty()) {
            throw new RuntimeException("Email không được để trống!");
        }
        if (userRepo.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email '" + req.getEmail() + "' đã được sử dụng!");
        }

        // 2. Map dữ liệu & Mã hóa mật khẩu 
        User user = new User();
        user.setEmail(req.getEmail());
        user.setFullName(req.getFullName());
        user.setAffiliation(req.getAffiliation());
        user.setPhoneNumber(req.getPhoneNumber());
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setActive(true);

        // 3. Gán quyền mặc định là AUTHOR 
        Role authorRole = roleRepo.findByName("ROLE_AUTHOR")
                .orElseThrow(() -> new RuntimeException("Lỗi hệ thống: Không tìm thấy Role AUTHOR."));

        user.setRoles(Set.of(authorRole));
        return userRepo.save(user);
    }

    // Đăng nhập 
    public User login(String email, String rawPassword) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại!"));
        
        if (!user.isActive()) {
            throw new RuntimeException("Tài khoản đã bị khóa!");
        }
        
        // So khớp mật khẩu 
        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new RuntimeException("Sai mật khẩu!");
        }
        return user;
    }
}