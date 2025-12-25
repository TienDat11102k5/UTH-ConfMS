package edu.uth.backend.security;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.Base64;

/**
 * Security utilities for password validation, token generation, etc.
 * 
 * @author Security Team
 * @since 1.0.0
 */
@Component
public class SecurityUtils {

    private static final SecureRandom secureRandom = new SecureRandom();
    private static final Base64.Encoder base64Encoder = Base64.getUrlEncoder().withoutPadding();

    /**
     * Generate secure random token
     * 
     * @param length Token length in bytes (will be longer after base64 encoding)
     * @return Base64-encoded random token
     */
    public String generateSecureToken(int length) {
        byte[] randomBytes = new byte[length];
        secureRandom.nextBytes(randomBytes);
        return base64Encoder.encodeToString(randomBytes);
    }

    /**
     * Generate secure random token with default length (32 bytes)
     * 
     * @return Base64-encoded random token
     */
    public String generateSecureToken() {
        return generateSecureToken(32);
    }

    /**
     * Generate numeric OTP code
     * 
     * @param length Number of digits
     * @return Numeric OTP string
     */
    public String generateOTP(int length) {
        StringBuilder otp = new StringBuilder();
        for (int i = 0; i < length; i++) {
            otp.append(secureRandom.nextInt(10));
        }
        return otp.toString();
    }

    /**
     * Generate 6-digit OTP (default)
     * 
     * @return 6-digit OTP
     */
    public String generateOTP() {
        return generateOTP(6);
    }

    /**
     * Validate password strength
     * 
     * @param password Password to validate
     * @return true if password meets requirements
     */
    public boolean isPasswordStrong(String password) {
        if (password == null || password.length() < 8) {
            return false;
        }

        boolean hasUpper = false;
        boolean hasLower = false;
        boolean hasDigit = false;
        boolean hasSpecial = false;

        for (char c : password.toCharArray()) {
            if (Character.isUpperCase(c)) hasUpper = true;
            else if (Character.isLowerCase(c)) hasLower = true;
            else if (Character.isDigit(c)) hasDigit = true;
            else hasSpecial = true;
        }

        // Require at least 3 of 4 categories
        int categories = (hasUpper ? 1 : 0) + (hasLower ? 1 : 0) + 
                        (hasDigit ? 1 : 0) + (hasSpecial ? 1 : 0);

        return categories >= 3;
    }

    /**
     * Get password strength score
     * 
     * @param password Password to check
     * @return Strength score: 0 (very weak) to 4 (very strong)
     */
    public int getPasswordStrength(String password) {
        if (password == null || password.isEmpty()) {
            return 0;
        }

        int score = 0;

        // Length check
        if (password.length() >= 8) score++;
        if (password.length() >= 12) score++;

        // Character variety
        boolean hasUpper = password.matches(".*[A-Z].*");
        boolean hasLower = password.matches(".*[a-z].*");
        boolean hasDigit = password.matches(".*\\d.*");
        boolean hasSpecial = password.matches(".*[^A-Za-z0-9].*");

        if (hasUpper && hasLower) score++;
        if (hasDigit) score++;
        if (hasSpecial) score++;

        // Bonus for very long passwords
        if (password.length() >= 16) score++;

        return Math.min(score, 4); // Cap at 4
    }

    /**
     * Check if password contains common weak patterns
     * 
     * @param password Password to check
     * @return true if password contains weak patterns
     */
    public boolean containsWeakPatterns(String password) {
        if (password == null) {
            return true;
        }

        String lowerPassword = password.toLowerCase();

        // Common weak passwords
        String[] weakPasswords = {
            "password", "123456", "12345678", "qwerty", "abc123",
            "monkey", "letmein", "trustno1", "dragon", "baseball",
            "iloveyou", "master", "sunshine", "ashley", "bailey",
            "passw0rd", "shadow", "123123", "654321", "superman"
        };

        for (String weak : weakPasswords) {
            if (lowerPassword.contains(weak)) {
                return true;
            }
        }

        // Sequential numbers or letters
        if (lowerPassword.matches(".*(012|123|234|345|456|567|678|789|890).*") ||
            lowerPassword.matches(".*(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz).*")) {
            return true;
        }

        // Repeated characters
        if (lowerPassword.matches(".*(.)\\1{2,}.*")) {
            return true;
        }

        return false;
    }

    /**
     * Sanitize user input to prevent XSS
     * 
     * @param input User input string
     * @return Sanitized string
     */
    public String sanitizeInput(String input) {
        if (input == null) {
            return null;
        }

        return input
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#x27;")
            .replace("/", "&#x2F;");
    }

    /**
     * Mask sensitive data for logging
     * Shows first 4 and last 4 characters
     * 
     * @param data Sensitive data
     * @return Masked data
     */
    public String maskSensitiveData(String data) {
        if (data == null || data.length() <= 8) {
            return "****";
        }

        String first = data.substring(0, 4);
        String last = data.substring(data.length() - 4);
        return first + "****" + last;
    }

    /**
     * Mask email address for logging
     * 
     * @param email Email address
     * @return Masked email (e.g., "te**@ex*****.com")
     */
    public String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "****";
        }

        String[] parts = email.split("@");
        if (parts.length != 2) {
            return "****";
        }

        String localPart = parts[0];
        String domain = parts[1];

        String maskedLocal = localPart.length() <= 2 
            ? "**" 
            : localPart.substring(0, 2) + "**";

        String[] domainParts = domain.split("\\.");
        String maskedDomain = domainParts[0].substring(0, 2) + "****";
        if (domainParts.length > 1) {
            maskedDomain += "." + domainParts[domainParts.length - 1];
        }

        return maskedLocal + "@" + maskedDomain;
    }

    /**
     * Check if string is safe filename
     * 
     * @param filename Filename to check
     * @return true if safe
     */
    public boolean isSafeFilename(String filename) {
        if (filename == null || filename.isEmpty()) {
            return false;
        }

        // Reject path traversal attempts
        if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            return false;
        }

        // Reject null bytes
        if (filename.contains("\0")) {
            return false;
        }

        // Check for valid characters (alphanumeric, dash, underscore, dot)
        return filename.matches("^[a-zA-Z0-9._-]+$");
    }

    /**
     * Generate safe filename from user input
     * 
     * @param originalFilename Original filename
     * @param userId User ID (for uniqueness)
     * @return Safe filename
     */
    public String generateSafeFilename(String originalFilename, Long userId) {
        if (originalFilename == null || originalFilename.isEmpty()) {
            return "file_" + userId + "_" + System.currentTimeMillis();
        }

        // Extract extension
        String extension = "";
        int lastDot = originalFilename.lastIndexOf('.');
        if (lastDot > 0) {
            extension = originalFilename.substring(lastDot);
        }

        // Generate UUID-based filename
        String uuid = java.util.UUID.randomUUID().toString();
        return "user_" + userId + "_" + uuid + extension;
    }
}
