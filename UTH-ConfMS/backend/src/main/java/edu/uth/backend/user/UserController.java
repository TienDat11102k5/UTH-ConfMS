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
import org.springframework.security.access.prepost.PreAuthorize;
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

    // ==================== GET PROFILE ====================
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(Authentication auth) {
        log.info("Get profile request");

        if (auth == null || auth.getPrincipal() == null) {
            log.warn("Get profile failed - unauthenticated");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Không được phép");
        }

        String email = auth.getName();
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            log.warn("Get profile failed - user not found, email={}", email);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy người dùng");
        }

        log.info("Get profile success - userId={}", user.getId());
        return ResponseEntity.ok(new UserProfileResponse(user));
    }

    // ==================== UPDATE PROFILE ====================
    @PreAuthorize("isAuthenticated()")
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            Authentication auth
    ) {
        log.info("Update profile request");

        if (auth == null || auth.getPrincipal() == null) {
            log.warn("Update profile failed - unauthenticated");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Không được phép");
        }

        String email = auth.getName();
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            log.warn("Update profile failed - user not found, email={}", email);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy người dùng");
        }

        // Update fields
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
        log.info("Update profile success - userId={}", user.getId());

        return ResponseEntity.ok(new UserProfileResponse(user));
    }

    // ==================== UPLOAD AVATAR ====================
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/upload-avatar")
    public ResponseEntity<?> uploadAvatar(
            @RequestParam("avatar") MultipartFile file,
            Authentication auth
    ) {
        log.info("Upload avatar request");

        if (auth == null || auth.getPrincipal() == null) {
            log.warn("Upload avatar failed - unauthenticated");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Không được phép");
        }

        String email = auth.getName();
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            log.warn("Upload avatar failed - user not found, email={}", email);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy người dùng");
        }

        if (file.isEmpty()) {
            log.warn("Upload avatar failed - empty file, userId={}", user.getId());
            return ResponseEntity.badRequest().body(Map.of("message", "File trống"));
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            log.warn("Upload avatar failed - file too large, userId={}", user.getId());
            return ResponseEntity.badRequest().body(Map.of("message", "Kích thước file vượt quá 5MB"));
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            log.warn("Upload avatar failed - invalid content type, userId={}", user.getId());
            return ResponseEntity.badRequest().body(Map.of("message", "Chỉ chấp nhận file ảnh"));
        }

        try {
            Path uploadPath = Path.of(uploadDir, "avatars");
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String filename = UUID.randomUUID().toString() + extension;
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String avatarUrl = baseUrl + "/uploads/avatars/" + filename;
            user.setAvatarUrl(avatarUrl);
            userRepository.save(user);

            log.info("Upload avatar success - userId={}", user.getId());
            return ResponseEntity.ok(new UserProfileResponse(user));

        } catch (IOException e) {
            log.error("Upload avatar error - userId={}, error={}", user.getId(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Tải file thất bại: " + e.getMessage()));
        }
    }

    // ==================== CHANGE PASSWORD ====================
    @PreAuthorize("isAuthenticated()")
    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestBody ChangePasswordRequest request,
            Authentication auth
    ) {
        log.info("Change password request");

        if (auth == null || auth.getPrincipal() == null) {
            log.warn("Change password failed - unauthenticated");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Không được phép"));
        }

        String email = auth.getName();
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            log.warn("Change password failed - user not found, email={}", email);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Không tìm thấy người dùng"));
        }

        if (user.getProvider() != User.AuthProvider.LOCAL) {
            log.warn("Change password failed - non local account, userId={}", user.getId());
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Không thể đổi mật khẩu cho tài khoản đăng nhập bằng Google"));
        }

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            log.warn("Change password failed - wrong current password, userId={}", user.getId());
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Mật khẩu hiện tại không đúng"));
        }

        if (request.getNewPassword() == null || request.getNewPassword().length() < 6) {
            log.warn("Change password failed - new password invalid, userId={}", user.getId());
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Mật khẩu mới phải có ít nhất 6 ký tự"));
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        log.info("Change password success - userId={}", user.getId());
        return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công"));
    }
}
