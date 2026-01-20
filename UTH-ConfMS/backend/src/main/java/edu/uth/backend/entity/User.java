package edu.uth.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
  @JsonIgnore
  private String passwordHash;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private AuthProvider provider = AuthProvider.LOCAL;

  @Column(name = "firebase_uid", length = 128)
  private String firebaseUid;

  @Column(name = "full_name", length = 180)
  private String fullName;

  @Column(name = "affiliation", length = 255)
  private String affiliation;

  @Column(name = "avatar_url", length = 500)
  private String avatarUrl;

  @Column(length = 20)
  private String phone;

  @Column(length = 100)
  private String country;

  @Column(length = 10)
  private String gender;

  @Column(length = 500)
  private String address;

  @Column(name = "date_of_birth")
  private java.time.LocalDate dateOfBirth;

  @Column(length = 1000)
  private String bio;

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
  public void setId(Long id) { this.id = id; }

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

  public String getAffiliation() { return affiliation; }
  public void setAffiliation(String affiliation) { this.affiliation = affiliation; }

  public String getAvatarUrl() { return avatarUrl; }
  public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

  public String getPhone() { return phone; }
  public void setPhone(String phone) { this.phone = phone; }

  public String getCountry() { return country; }
  public void setCountry(String country) { this.country = country; }

  public String getGender() { return gender; }
  public void setGender(String gender) { this.gender = gender; }

  public String getAddress() { return address; }
  public void setAddress(String address) { this.address = address; }

  public java.time.LocalDate getDateOfBirth() { return dateOfBirth; }
  public void setDateOfBirth(java.time.LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }

  public String getBio() { return bio; }
  public void setBio(String bio) { this.bio = bio; }

  public boolean isEnabled() { return enabled; }
  public void setEnabled(boolean enabled) { this.enabled = enabled; }

  public Set<Role> getRoles() { return roles; }
  public void setRoles(Set<Role> roles) { this.roles = roles; }
}
