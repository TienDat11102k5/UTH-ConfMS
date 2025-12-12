package edu.uth.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Request cho API đặt lại mật khẩu bằng token */
@Data
public class ResetPasswordRequest {
  @NotBlank
  private String token;

  @NotBlank
  @Size(min = 8, max = 72)
  private String newPassword;
}
