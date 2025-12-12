package edu.uth.backend.config;

import edu.uth.backend.entity.Role;
import edu.uth.backend.entity.User;
import edu.uth.backend.repository.RoleRepository;
import edu.uth.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.Set;

@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true", matchIfMissing = true)
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepo;
    private final RoleRepository roleRepo;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepo, RoleRepository roleRepo, PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        System.out.println("⏳ DataSeeder: initializing base data...");

        Role roleAdmin = ensureRole("ROLE_ADMIN");
        ensureRole("ROLE_CHAIR");
        ensureRole("ROLE_AUTHOR");
        ensureRole("ROLE_REVIEWER");

        User admin = userRepo.findByEmail("admin@uth.edu.vn").orElse(null);

        if (admin == null) {
            admin = new User();
            admin.setEmail("admin@uth.edu.vn");
            admin.setFullName("Super Administrator");
            admin.setPasswordHash(passwordEncoder.encode("admin123"));

            Set<Role> roles = new HashSet<>();
            roles.add(roleAdmin);
            admin.setRoles(roles);

            userRepo.save(admin);
            System.out.println("✅ Seeded admin user: admin@uth.edu.vn (password: admin123)");
        } else {
            if (admin.getRoles() == null) admin.setRoles(new HashSet<>());

            boolean hasAdminRole = admin.getRoles().stream()
                    .anyMatch(r -> "ROLE_ADMIN".equals(r.getName()));

            if (!hasAdminRole) {
                admin.getRoles().add(roleAdmin);
                userRepo.save(admin);
                System.out.println("✅ Updated existing admin user: added ROLE_ADMIN");
            } else {
                System.out.println("ℹ️ Admin already exists with ROLE_ADMIN");
            }
        }

        System.out.println("✅ DataSeeder done.");
    }

    private Role ensureRole(String roleName) {
        return roleRepo.findByName(roleName)
                .orElseGet(() -> {
                    Role r = new Role(roleName);
                    Role saved = roleRepo.save(r);
                    System.out.println("✅ Seeded role: " + roleName);
                    return saved;
                });
    }
}
