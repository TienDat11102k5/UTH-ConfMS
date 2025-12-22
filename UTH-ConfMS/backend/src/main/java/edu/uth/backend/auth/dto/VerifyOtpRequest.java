package edu.uth.backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/** Request cho API xác thực OTP */
@Data
public class VerifyOtpRequest {
  @NotBlank
  @Email
  private String email;

  @NotBlank
  @Pattern(regexp = "\\d{6}", message = "OTP phải là 6 chữ số")
  private String otp;
}
