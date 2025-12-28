package edu.uth.backend.admin;
import lombok.extern.slf4j.Slf4j;
import edu.uth.backend.admin.dto.AdminUserResponse;
import edu.uth.backend.admin.dto.UpdateRoleRequest;
import edu.uth.backend.admin.dto.UpdateStatusRequest;
import edu.uth.backend.admin.dto.UpdateUserNameRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminUserController {

    @Autowired
    private AdminService adminService;
    
    @Autowired
    private edu.uth.backend.security.AuditLogger auditLogger;

    @GetMapping
    public ResponseEntity<List<AdminUserResponse>> getAllUsers() {
        log.info("GET /api/admin/users - Get all users");
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<?> updateRole(
            @PathVariable Long id,
            @Validated @RequestBody UpdateRoleRequest request,
            org.springframework.security.core.Authentication authentication
    ) {
        log.info("PUT /api/admin/users/{}/role - Update role to {}", id, request.getRole());
        
        // Get old role before update
        var allUsers = adminService.getAllUsers();
        var userBefore = allUsers.stream()
            .filter(u -> u.getId().equals(id))
            .findFirst()
            .orElse(null);
        String oldRole = userBefore != null ? userBefore.getRole() : "UNKNOWN";
        
        var result = adminService.updateUserRole(id, request.getRole());
        
        // Audit log
        String adminUser = authentication != null ? authentication.getName() : "unknown";
        auditLogger.logRoleChange(result.getEmail(), oldRole, result.getRole(), adminUser, getClientIp());
        
        return ResponseEntity.ok(result);
    }
    
    private String getClientIp() {
        try {
            jakarta.servlet.http.HttpServletRequest request = 
                ((org.springframework.web.context.request.ServletRequestAttributes) 
                org.springframework.web.context.request.RequestContextHolder.getRequestAttributes()).getRequest();
            String xForwardedFor = request.getHeader("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                return xForwardedFor.split(",")[0].trim();
            }
            return request.getRemoteAddr();
        } catch (Exception e) {
            return "unknown";
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @Validated @RequestBody UpdateStatusRequest request
    ) {
        log.info("PUT /api/admin/users/{}/status - Update enabled={}", id, request.getEnabled());
        return ResponseEntity.ok(
                adminService.updateUserStatus(id, Boolean.TRUE.equals(request.getEnabled()))
        );
    }

    @PutMapping("/{id}/name")
    public ResponseEntity<?> updateFullName(
            @PathVariable Long id,
            @Validated @RequestBody UpdateUserNameRequest request
    ) {
        log.info("PUT /api/admin/users/{}/name - Update fullName={}", id, request.getFullName());
        return ResponseEntity.ok(
                adminService.updateUserFullName(id, request.getFullName())
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        log.warn("DELETE /api/admin/users/{} - Delete user", id);
        adminService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
