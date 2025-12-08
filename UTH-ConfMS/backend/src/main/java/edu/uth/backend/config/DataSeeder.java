package edu.uth.backend.config;

import edu.uth.backend.entity.*;
import edu.uth.backend.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Configuration
public class DataSeeder {

    // Bean này giúp mã hóa mật khẩu (bắt buộc phải có)
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    CommandLineRunner initDatabase(
            UserRepository userRepo,
            RoleRepository roleRepo,
            ConferenceRepository confRepo,
            TrackRepository trackRepo,
            PaperRepository paperRepo,
            PasswordEncoder passwordEncoder) {
        return args -> {
            System.out.println("⏳ Đang khởi tạo dữ liệu mẫu...");

            // 1. TẠO ROLES (Nếu chưa có)
            if (roleRepo.count() == 0) {
                roleRepo.save(new Role("ROLE_ADMIN"));
                roleRepo.save(new Role("ROLE_CHAIR"));
                roleRepo.save(new Role("ROLE_AUTHOR"));
                roleRepo.save(new Role("ROLE_REVIEWER"));
                System.out.println("✅ Đã tạo Roles");
            }

            // 2. TẠO ADMIN (Nếu chưa có)
            if (!userRepo.existsByEmail("admin@uth.edu.vn")) {
                User admin = new User();
                admin.setEmail("admin@uth.edu.vn");
                admin.setFullName("Super Administrator");
                admin.setPasswordHash(passwordEncoder.encode("admin123")); // Pass: admin123
                admin.setActive(true);
                
                // Gán quyền Admin
                Role adminRole = roleRepo.findByName("ROLE_ADMIN").orElseThrow();
                Set<Role> roles = new HashSet<>();
                roles.add(adminRole);
                admin.setRoles(roles);

                userRepo.save(admin);
                System.out.println("✅ Đã tạo Admin: admin@uth.edu.vn / admin123");
            }

            // 3. TẠO DỮ LIỆU TEST REPOSITORY (Conference & Paper)
            if (confRepo.count() == 0) {
                // Tạo Hội nghị
                Conference conf = new Conference();
                conf.setName("UTH Science 2025");
                conf.setDescription("Hội nghị khoa học công nghệ thường niên");
                conf.setStartDate(LocalDateTime.now().plusMonths(1));
                conf.setSubmissionDeadline(LocalDateTime.now().plusWeeks(2));
                conf.setOrganizer(userRepo.findByEmail("admin@uth.edu.vn").get()); // Admin làm Chair luôn
                
                confRepo.save(conf);

                // Tạo Track (Chủ đề)
                Track trackCNTT = new Track();
                trackCNTT.setName("Công nghệ thông tin");
                trackCNTT.setConference(conf);
                trackRepo.save(trackCNTT);

                Track trackKinhTe = new Track();
                trackKinhTe.setName("Kinh tế vận tải");
                trackKinhTe.setConference(conf);
                trackRepo.save(trackKinhTe);

                // Tạo Bài báo (Nộp thử)
                Paper paper = new Paper();
                paper.setTitle("Nghiên cứu AI trong quản lý giao thông");
                paper.setAbstractText("Tóm tắt bài báo abc xyz...");
                paper.setStatus(PaperStatus.SUBMITTED);
                paper.setMainAuthor(userRepo.findByEmail("admin@uth.edu.vn").get()); // Admin nộp bài
                paper.setTrack(trackCNTT); // Nộp vào track CNTT

                paperRepo.save(paper);
                
                System.out.println("✅ Đã tạo dữ liệu mẫu: 1 Hội nghị, 2 Tracks, 1 Bài báo.");
            }
        };
    }
}