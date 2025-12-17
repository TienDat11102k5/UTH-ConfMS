package edu.uth.backend.admin;

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
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminUserController {

    @Autowired
    private AdminService adminService;

    @GetMapping
    public ResponseEntity<List<AdminUserResponse>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<?> updateRole(
            @PathVariable Long id,
            @Validated @RequestBody UpdateRoleRequest request
    ) {
        try {
            return ResponseEntity.ok(adminService.updateUserRole(id, request.getRole()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @Validated @RequestBody UpdateStatusRequest request
    ) {
        try {
            return ResponseEntity.ok(adminService.updateUserStatus(id, Boolean.TRUE.equals(request.getEnabled())));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/name")
    public ResponseEntity<?> updateFullName(
            @PathVariable Long id,
            @Validated @RequestBody UpdateUserNameRequest request
    ) {
        try {
            return ResponseEntity.ok(adminService.updateUserFullName(id, request.getFullName()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            adminService.deleteUser(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
