package edu.uth.backend.config;

import edu.uth.backend.security.JwtAuthFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.security.authentication.*;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.*;
import org.springframework.security.web.header.writers.StaticHeadersWriter;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.*;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

  private final JwtAuthFilter jwtAuthFilter;

  @Value("${app.cors.allowed-origins}")
  private String allowedOrigins;

  public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
    this.jwtAuthFilter = jwtAuthFilter;
  }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .csrf(csrf -> csrf.disable())
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers(
              "/api/auth/**",
              "/uploads/**",
              "/v3/api-docs/**",
              "/swagger-ui/**",
              "/swagger-ui.html"
            ).permitAll()
            // Public GET cho danh sách/chi tiết hội nghị
            .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/conferences/**").permitAll()
            // TEMPORARY: Allow decisions, assignments, reviews and submissions endpoints for testing
            // TODO: Remove this after testing - these should require authentication
            .requestMatchers("/api/decisions/**", "/api/assignments/**", "/api/reviews/**", "/api/submissions/**").permitAll()
            // Các method khác cần xác thực (và đã có @PreAuthorize kiểm soát role)
            .anyRequest().authenticated()
        )
        .headers(headers -> headers.addHeaderWriter(
          new StaticHeadersWriter("Cross-Origin-Opener-Policy", "same-origin-allow-popups")
        ))
        .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }

    @Bean
    PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
    return config.getAuthenticationManager();
  }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration cfg = new CorsConfiguration();

    List<String> origins = Arrays.stream(allowedOrigins.split(","))
        .map(String::trim)
        .filter(s -> !s.isBlank())
        .toList();

    // Cho phép các origin cụ thể (hoặc mẫu) và header phổ biến để preflight của trình duyệt thành công
    cfg.setAllowedOrigins(origins);
    cfg.setAllowedOriginPatterns(origins);
    cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    cfg.setAllowedHeaders(List.of("*"));
    cfg.setExposedHeaders(List.of("Authorization"));
    cfg.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", cfg);
    return source;
  }
}
