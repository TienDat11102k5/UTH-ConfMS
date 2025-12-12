package edu.uth.backend.auth.dto;

import jakarta.validation.constraints.*;

public class RegisterRequest {
  @NotBlank @Email
  private String email;

  @NotBlank @Size(min = 6, max = 100)
  private String password;

  @NotBlank @Size(max = 180)
  private String fullName;

  @Size(max = 255)
  private String affiliation;

  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }

  public String getPassword() { return password; }
  public void setPassword(String password) { this.password = password; }

  public String getFullName() { return fullName; }
  public void setFullName(String fullName) { this.fullName = fullName; }

  public String getAffiliation() { return affiliation; }
  public void setAffiliation(String affiliation) { this.affiliation = affiliation; }
}
