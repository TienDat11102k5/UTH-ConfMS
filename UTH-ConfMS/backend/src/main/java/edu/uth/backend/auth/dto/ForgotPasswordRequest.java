package edu.uth.backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/** Request cho API quên mật khẩu */
@Data
public class ForgotPasswordRequest {
  @NotBlank
  @Email
  private String email;
}
