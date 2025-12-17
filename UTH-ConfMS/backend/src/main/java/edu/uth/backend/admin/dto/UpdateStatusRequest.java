package edu.uth.backend.admin.dto;

import jakarta.validation.constraints.NotNull;

public class UpdateStatusRequest {
    @NotNull
    private Boolean enabled;

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }
}
