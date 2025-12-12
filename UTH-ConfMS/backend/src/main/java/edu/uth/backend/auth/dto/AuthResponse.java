package edu.uth.backend.auth.dto;

public class AuthResponse {
  private String accessToken;
  private String tokenType = "Bearer";
  private long expiresInMs;

  private UserInfo user;

  public static class UserInfo {
    public Long id;
    public String email;
    public String fullName;
    public String avatarUrl;
    public String provider;
    public String role;  // Primary role for routing
  }

  public String getAccessToken() { return accessToken; }
  public void setAccessToken(String accessToken) { this.accessToken = accessToken; }

  public String getTokenType() { return tokenType; }
  public void setTokenType(String tokenType) { this.tokenType = tokenType; }

  public long getExpiresInMs() { return expiresInMs; }
  public void setExpiresInMs(long expiresInMs) { this.expiresInMs = expiresInMs; }

  public UserInfo getUser() { return user; }
  public void setUser(UserInfo user) { this.user = user; }
}
