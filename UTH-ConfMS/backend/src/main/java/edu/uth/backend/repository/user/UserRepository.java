package edu.uth.backend.repository.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import edu.uth.backend.entity.user.User;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    // Tìm user theo email (Dùng cho chức năng Login)
    Optional<User> findByEmail(String email);

    // Kiểm tra email đã tồn tại chưa (Dùng cho Validate khi đăng ký)
    boolean existsByEmail(String email);
}