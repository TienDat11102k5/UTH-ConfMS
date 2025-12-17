package edu.uth.backend.admin.dto;

import jakarta.validation.constraints.NotBlank;

public class UpdateUserNameRequest {
    @NotBlank
    private String fullName;

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }
}
