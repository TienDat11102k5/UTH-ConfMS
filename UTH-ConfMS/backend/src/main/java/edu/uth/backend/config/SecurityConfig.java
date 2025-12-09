package edu.uth.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // 1. Tắt CSRF (Cross-Site Request Forgery) vì chúng ta giao tiếp qua API (Postman/React)
            .csrf(AbstractHttpConfigurer::disable)
            
            // 2. Cấu hình quyền truy cập
            .authorizeHttpRequests(auth -> auth
                // Cho phép truy cập tự do vào các API Auth (Đăng ký/Đăng nhập)
                .requestMatchers("/api/auth/**").permitAll()
                // Cho phép truy cập tự do vào Swagger (nếu có dùng)
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**").permitAll()
                // TẠM THỜI: Cho phép tất cả các request khác cũng truy cập được luôn (để bạn test Nộp bài, Tạo hội nghị cho dễ)
                // Sau này làm xong tính năng Login lấy Token thì sẽ sửa dòng này lại sau.
                .anyRequest().permitAll() 
            );

        return http.build();
    }
}