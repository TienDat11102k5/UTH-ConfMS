package edu.uth.backend.security;

import edu.uth.backend.entity.Role;
import edu.uth.backend.entity.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtTokenProvider {

  private final Key key;
  private final long expirationMs;

    public JwtTokenProvider(
      @Value("${app.jwt.secret}") String secret,
      @Value("${app.jwt.expiration-ms}") long expirationMs
  ) {
    if (secret == null || secret.length() < 32) {
      throw new IllegalArgumentException("JWT secret phải có ít nhất 32 ký tự.");
    }
    this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    this.expirationMs = expirationMs;
  }

  public long getExpirationMs() {
    return expirationMs;
  }

  public String generateToken(User user) {
    Date now = new Date();
    Date exp = new Date(now.getTime() + expirationMs);

    List<String> roles = user.getRoles().stream()
        .map(Role::getName)
        .collect(Collectors.toList());

    return Jwts.builder()
        .setSubject(user.getEmail())
        .claim("roles", roles)
        .setIssuedAt(now)
        .setExpiration(exp)
        .signWith(key, SignatureAlgorithm.HS256)
        .compact();
  }

  public String getEmailFromToken(String token) {
    return parseClaims(token).getBody().getSubject();
  }

  public boolean validate(String token) {
    try {
      parseClaims(token);
      return true;
    } catch (JwtException | IllegalArgumentException ex) {
      return false;
    }
  }

  private Jws<Claims> parseClaims(String token) {
    return Jwts.parserBuilder()
        .setSigningKey(key)
        .build()
        .parseClaimsJws(token);
  }
}
