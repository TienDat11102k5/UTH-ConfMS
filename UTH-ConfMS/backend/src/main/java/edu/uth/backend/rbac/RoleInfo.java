package edu.uth.backend.rbac;

import java.util.List;

public class RoleInfo {
    private Long id;
    private String name;
    private long userCount;
    private List<String> permissions;

    public RoleInfo() {}

    public RoleInfo(Long id, String name, long userCount, List<String> permissions) {
        this.id = id;
        this.name = name;
        this.userCount = userCount;
        this.permissions = permissions;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public long getUserCount() {
        return userCount;
    }

    public void setUserCount(long userCount) {
        this.userCount = userCount;
    }

    public List<String> getPermissions() {
        return permissions;
    }

    public void setPermissions(List<String> permissions) {
        this.permissions = permissions;
    }
}
