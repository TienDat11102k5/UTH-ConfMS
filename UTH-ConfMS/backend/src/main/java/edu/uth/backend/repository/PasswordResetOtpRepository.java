package edu.uth.backend.repository;

import edu.uth.backend.entity.PasswordResetOtp;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;

public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtp, Long> {

  Optional<PasswordResetOtp> findByEmailAndVerifiedAtIsNull(String email);

  void deleteByEmail(String email);

  long deleteByExpiresAtBefore(Instant now);
}
