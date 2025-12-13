package edu.uth.backend.user.dto;

import edu.uth.backend.entity.Role;
import edu.uth.backend.entity.User;

public class UserProfileResponse {
    private Long id;
    private String email;
    private String fullName;
    private String affiliation;
    private String avatarUrl;
    private String phone;
    private String country;
    private String bio;
    private String role;
    private String provider;

    public UserProfileResponse(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.fullName = user.getFullName();
        this.affiliation = user.getAffiliation();
        this.avatarUrl = user.getAvatarUrl();
        this.phone = user.getPhone();
        this.country = user.getCountry();
        this.bio = user.getBio();
        this.provider = user.getProvider().name();
        
        // Get primary role
        if (user.getRoles() != null && !user.getRoles().isEmpty()) {
            this.role = user.getRoles().iterator().next().getName();
        }
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getAffiliation() {
        return affiliation;
    }

    public void setAffiliation(String affiliation) {
        this.affiliation = affiliation;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }
}
