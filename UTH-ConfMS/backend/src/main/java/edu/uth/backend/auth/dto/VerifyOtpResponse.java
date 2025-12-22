package edu.uth.backend.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/** Response cho API xác thực OTP */
@Data
@AllArgsConstructor
public class VerifyOtpResponse {
  private String verifiedToken; // Token để dùng cho reset password
}
