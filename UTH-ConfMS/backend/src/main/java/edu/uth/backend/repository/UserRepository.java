package edu.uth.backend.repository;

import edu.uth.backend.entity.Role;
import edu.uth.backend.entity.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface UserRepository extends JpaRepository<User, Long> {
  Optional<User> findByEmail(String email);

  boolean existsByEmail(String email);

  // Tìm users có role REVIEWER hoặc PC
  @Query("SELECT DISTINCT u FROM User u JOIN u.roles r WHERE r.name IN ('ROLE_REVIEWER', 'ROLE_PC')")
  List<User> findAllReviewers();

  // Đếm số users có role cụ thể
  long countByRolesContaining(Role role);
}
