package edu.uth.backend.admin.dto;

import edu.uth.backend.entity.User;

public class AdminUserResponse {
    private Long id;
    private String name;
    private String email;
    private String role;
    private String status;

    public AdminUserResponse(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.name = user.getFullName() != null ? user.getFullName() : user.getEmail();
        this.role = user.getRoles().stream()
                .findFirst()
                .map(r -> r.getName().replaceFirst("^ROLE_", ""))
                .orElse("USER");
        this.status = user.isEnabled() ? "Active" : "Disabled";
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getRole() {
        return role;
    }

    public String getStatus() {
        return status;
    }
}
