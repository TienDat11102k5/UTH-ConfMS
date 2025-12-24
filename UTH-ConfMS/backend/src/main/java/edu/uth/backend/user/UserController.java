package edu.uth.backend.user;

import edu.uth.backend.entity.User;
import edu.uth.backend.repository.UserRepository;
import edu.uth.backend.user.dto.ChangePasswordRequest;
import edu.uth.backend.user.dto.UpdateProfileRequest;
import edu.uth.backend.user.dto.UserProfileResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.base.url:http://localhost:8080}")
    private String baseUrl;

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Không được phép");
        }

        String email = auth.getName();
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy người dùng");
        }

        return ResponseEntity.ok(new UserProfileResponse(user));
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            Authentication auth
    ) {
        if (auth == null || auth.getPrincipal() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Không được phép");
        }

        String email = auth.getName();
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy người dùng");
        }

        System.out.println("Đang cập nhật hồ sơ cho người dùng: " + email);
        System.out.println("Dữ liệu yêu cầu: fullName=" + request.getFullName() + 
                 ", phone=" + request.getPhone() + 
                 ", gender=" + request.getGender() +
                 ", address=" + request.getAddress() +
                 ", dateOfBirth=" + request.getDateOfBirth() +
                 ", affiliation=" + request.getAffiliation());

        // Cập nhật hồ sơ người dùng
        if (request.getFullName() != null && !request.getFullName().isEmpty()) {
            user.setFullName(request.getFullName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getAffiliation() != null) {
            user.setAffiliation(request.getAffiliation());
        }
        if (request.getGender() != null) {
            user.setGender(request.getGender());
        }
        if (request.getAddress() != null) {
            user.setAddress(request.getAddress());
        }
        if (request.getDateOfBirth() != null) {
            user.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }

        userRepository.save(user);
        System.out.println("Cập nhật hồ sơ thành công cho người dùng: " + email);

        return ResponseEntity.ok(new UserProfileResponse(user));
    }

    @PostMapping("/upload-avatar")
    public ResponseEntity<?> uploadAvatar(
            @RequestParam("avatar") MultipartFile file,
            Authentication auth
    ) {
        if (auth == null || auth.getPrincipal() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Không được phép");
        }

        String email = auth.getName();
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy người dùng");
        }

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "File trống"));
        }

        // Kiểm tra kích thước file (tối đa 5MB)
        if (file.getSize() > 5 * 1024 * 1024) {
            return ResponseEntity.badRequest().body(Map.of("message", "Kích thước file vượt quá 5MB"));
        }

        // Kiểm tra loại file
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Chỉ chấp nhận file ảnh"));
        }

        try {
            // Tạo thư mục tải lên nếu chưa tồn tại
            Path uploadPath = Path.of(uploadDir, "avatars");
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Tạo tên file duy nhất
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String filename = UUID.randomUUID().toString() + extension;

            // Lưu file
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Cập nhật URL avatar của người dùng
            String avatarUrl = baseUrl + "/uploads/avatars/" + filename;
            user.setAvatarUrl(avatarUrl);
            userRepository.save(user);

            return ResponseEntity.ok(new UserProfileResponse(user));

        } catch (IOException e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Tải file thất bại: " + e.getMessage()));
        }
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestBody ChangePasswordRequest request,
            Authentication auth
    ) {
        if (auth == null || auth.getPrincipal() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Không được phép"));
        }

        String email = auth.getName();
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Không tìm thấy người dùng"));
        }

        // Kiểm tra xem người dùng sử dụng xác thực LOCAL
        if (user.getProvider() != User.AuthProvider.LOCAL) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Không thể đổi mật khẩu cho tài khoản đăng nhập bằng Google"));
        }

        // Xác minh mật khẩu hiện tại
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Mật khẩu hiện tại không đúng"));
        }

        // Kiểm tra mật khẩu mới
        if (request.getNewPassword() == null || request.getNewPassword().length() < 6) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Mật khẩu mới phải có ít nhất 6 ký tự"));
        }

        // Cập nhật mật khẩu
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công"));
    }
}
