package edu.uth.backend.admin;

import edu.uth.backend.admin.dto.AdminUserResponse;
import edu.uth.backend.entity.Role;
import edu.uth.backend.entity.User;
import edu.uth.backend.repository.PaperRepository;
import edu.uth.backend.repository.RoleRepository;
import edu.uth.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AdminService {
    @Autowired private UserRepository userRepo;
    @Autowired private PaperRepository paperRepo;
    @Autowired private RoleRepository roleRepo;

    public List<AdminUserResponse> getAllUsers() {
        return userRepo.findAll().stream()
                .map(AdminUserResponse::new)
                .collect(Collectors.toList());
    }

    public User toggleUserActive(Long userId) {
        User user = userRepo.findById(userId).orElseThrow(() -> new RuntimeException("User không tồn tại"));
        user.setEnabled(!user.isEnabled());
        return userRepo.save(user);
    }

    public AdminUserResponse updateUserStatus(Long userId, boolean enabled) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));
        user.setEnabled(enabled);
        User saved = userRepo.save(user);
        return new AdminUserResponse(saved);
    }

    public AdminUserResponse updateUserFullName(Long userId, String fullName) {
        if (!StringUtils.hasText(fullName)) {
            throw new RuntimeException("fullName không được để trống");
        }

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        user.setFullName(fullName.trim());
        User saved = userRepo.save(user);
        return new AdminUserResponse(saved);
    }

    public Map<String, Long> getSystemStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("totalUsers", userRepo.count());
        stats.put("totalPapers", paperRepo.count());
        return stats;
    }

    public AdminUserResponse updateUserRole(Long userId, String roleName) {
        if (!StringUtils.hasText(roleName)) {
            throw new RuntimeException("role không được để trống");
        }


        String temp = roleName.trim().toUpperCase();
        final String normalized = temp.startsWith("ROLE_") ? temp : "ROLE_" + temp;

        Role role = roleRepo.findByName(normalized)
                .orElseThrow(() -> new RuntimeException("Role không tồn tại: " + normalized));

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        Set<Role> roles = new HashSet<>();
        roles.add(role);
        user.setRoles(roles);

        User saved = userRepo.save(user);
        return new AdminUserResponse(saved);
    }

    public void deleteUser(Long userId) {
        if (!userRepo.existsById(userId)) {
            throw new RuntimeException("User không tồn tại");
        }
        userRepo.deleteById(userId);
    }
}
