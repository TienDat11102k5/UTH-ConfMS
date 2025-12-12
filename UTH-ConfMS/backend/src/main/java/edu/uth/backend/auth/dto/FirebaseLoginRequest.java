package edu.uth.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;

public class FirebaseLoginRequest {
  @NotBlank
  private String idToken;

  public String getIdToken() { return idToken; }
  public void setIdToken(String idToken) { this.idToken = idToken; }
}
