package edu.uth.backend.entity;

import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
public class User {

  public enum AuthProvider { LOCAL, GOOGLE }

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true, length = 180)
  private String email;

  // LOCAL dùng passwordHash; GOOGLE có thể null
  @Column(name = "password_hash", length = 255)
  private String passwordHash;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private AuthProvider provider = AuthProvider.LOCAL;

  @Column(name = "firebase_uid", length = 128)
  private String firebaseUid;

  @Column(name = "full_name", length = 180)
  private String fullName;

  @Column(name = "avatar_url", length = 500)
  private String avatarUrl;

  @Column(nullable = false)
  private boolean enabled = true;

  @ManyToMany(fetch = FetchType.EAGER)
  @JoinTable(
      name = "user_roles",
      joinColumns = @JoinColumn(name = "user_id"),
      inverseJoinColumns = @JoinColumn(name = "role_id")
  )
  private Set<Role> roles = new HashSet<>();

  public Long getId() { return id; }

  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }

  public String getPasswordHash() { return passwordHash; }
  public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

  public AuthProvider getProvider() { return provider; }
  public void setProvider(AuthProvider provider) { this.provider = provider; }

  public String getFirebaseUid() { return firebaseUid; }
  public void setFirebaseUid(String firebaseUid) { this.firebaseUid = firebaseUid; }

  public String getFullName() { return fullName; }
  public void setFullName(String fullName) { this.fullName = fullName; }

  public String getAvatarUrl() { return avatarUrl; }
  public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

  public boolean isEnabled() { return enabled; }
  public void setEnabled(boolean enabled) { this.enabled = enabled; }

  public Set<Role> getRoles() { return roles; }
  public void setRoles(Set<Role> roles) { this.roles = roles; }
}
