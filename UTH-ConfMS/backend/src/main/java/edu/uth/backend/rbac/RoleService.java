package edu.uth.backend.rbac;

import edu.uth.backend.entity.Role;
import edu.uth.backend.repository.RoleRepository;
import edu.uth.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RoleService {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;

    public RoleService(RoleRepository roleRepository, UserRepository userRepository) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<RoleInfo> getAllRolesWithUserCount() {
        List<Role> roles = roleRepository.findAll();
        
        return roles.stream()
            .map(role -> {
                long userCount = userRepository.countByRolesContaining(role);
                return new RoleInfo(
                    role.getId(),
                    role.getName(),
                    userCount,
                    getPermissionsForRole(role.getName())
                );
            })
            .collect(Collectors.toList());
    }

    private List<String> getPermissionsForRole(String roleName) {
        // Định nghĩa permissions cho từng role
        switch (roleName) {
            case "ROLE_ADMIN":
                return List.of(
                    "manage_users",
                    "manage_conferences", 
                    "manage_ai",
                    "backup_restore",
                    "view_audit_logs",
                    "lock_conferences"
                );
            case "ROLE_CHAIR":
                return List.of(
                    "create_conference",
                    "edit_conference",
                    "assign_reviewers",
                    "view_all_submissions",
                    "make_decisions"
                );
            case "ROLE_REVIEWER":
                return List.of(
                    "view_assigned_papers",
                    "submit_reviews",
                    "view_own_reviews"
                );
            case "ROLE_AUTHOR":
                return List.of(
                    "submit_papers",
                    "view_own_submissions",
                    "upload_camera_ready",
                    "view_decisions"
                );
            default:
                return List.of();
        }
    }
}
