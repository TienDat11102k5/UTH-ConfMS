package edu.uth.backend.repository;

import edu.uth.backend.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

  Optional<PasswordResetToken> findByTokenHashAndUsedAtIsNull(String tokenHash);

  void deleteByUser_Id(Long userId);

  long deleteByExpiresAtBefore(Instant now);
}
