package edu.uth.backend.security;

import edu.uth.backend.common.RoleConstants;
import edu.uth.backend.entity.Role;
import edu.uth.backend.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit Tests cho JwtTokenProvider
 * Test các chức năng: Generate Token, Validate Token, Extract Claims
 */
@ExtendWith(MockitoExtension.class)
class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;
    private User testUser;
    private String testSecret;

    @BeforeEach
    void setUp() {
         testSecret = "test-secret-key-that-is-long-enough-for-hs256-algorithm-minimum-256-bits";
         long expirationMs = 86400000L;
         jwtTokenProvider = new JwtTokenProvider(testSecret, expirationMs);

        // Setup test user
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setFullName("Test User");
        
        Role authorRole = new Role(RoleConstants.ROLE_AUTHOR);
        testUser.setRoles(new HashSet<>());
        testUser.getRoles().add(authorRole);
    }

    @Test
    void testGenerateToken_Success() {
        // Act
        String token = jwtTokenProvider.generateToken(testUser);

        // Assert
        assertNotNull(token);
        assertFalse(token.isEmpty());
        assertTrue(token.split("\\.").length == 3); // JWT has 3 parts: header.payload.signature
    }

    @Test
    void testValidateToken_ValidToken_ReturnsTrue() {
        // Arrange
        String token = jwtTokenProvider.generateToken(testUser);

        // Act
        boolean isValid = jwtTokenProvider.validate(token);

        // Assert
        assertTrue(isValid);
    }

    @Test
    void testValidateToken_InvalidToken_ReturnsFalse() {
        // Arrange
        String invalidToken = "invalid.jwt.token";

        // Act
        boolean isValid = jwtTokenProvider.validate(invalidToken);

        // Assert
        assertFalse(isValid);
    }

    @Test
    void testGetEmailFromToken_Success() {
        // Arrange
        String token = jwtTokenProvider.generateToken(testUser);

        // Act
        String email = jwtTokenProvider.getEmailFromToken(token);

        // Assert
        assertEquals("test@example.com", email);
    }



    @Test
    void testTokenContainsCorrectClaims() {
        // Arrange
        String token = jwtTokenProvider.generateToken(testUser);
        
        // Parse token manually to verify claims
        SecretKey key = Keys.hmacShaKeyFor(testSecret.getBytes(StandardCharsets.UTF_8));
        Claims claims = Jwts.parserBuilder()
            .setSigningKey(key)
            .build()
            .parseClaimsJws(token)
            .getBody();

        // Assert
        assertEquals("test@example.com", claims.getSubject());
        assertNotNull(claims.getIssuedAt());
        assertNotNull(claims.getExpiration());
    }

    @Test
    void testGetExpirationMs() {
        // Act
        long expirationMs = jwtTokenProvider.getExpirationMs();

        // Assert
        assertEquals(86400000L, expirationMs); // 24 hours
    }
}
