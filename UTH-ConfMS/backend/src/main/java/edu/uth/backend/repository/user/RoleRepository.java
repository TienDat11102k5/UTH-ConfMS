package edu.uth.backend.repository.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import edu.uth.backend.entity.user.Role;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    
    // Tìm quyền theo tên (VD: lấy ROLE_ADMIN ra để gán cho user)
    Optional<Role> findByName(String name);
}