package edu.uth.backend.common;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.List;

@Service
public class FileValidationService {

    private static final Logger logger = LoggerFactory.getLogger(FileValidationService.class);

    // File size constraints
    private static final long MAX_FILE_SIZE = 25L * 1024 * 1024; // 25MB
    private static final long MIN_FILE_SIZE = 1024; // 1KB

    // Allowed MIME types
    private static final List<String> ALLOWED_PDF_MIME_TYPES = Arrays.asList(
        "application/pdf"
    );

    // PDF Magic Number (first 5 bytes)
    private static final byte[] PDF_SIGNATURE = {0x25, 0x50, 0x44, 0x46, 0x2D}; // %PDF-

    /**
     * Validate uploaded PDF file with comprehensive checks
     */
    public void validatePdfFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File không được để trống");
        }

        // 1. Check file size
        validateFileSize(file);

        // 2. Check file name
        validateFileName(file);

        // 3. Check MIME type
        validateMimeType(file);

        // 4. Check file signature (magic number)
        validateFileSignature(file);
    }

    /**
     * Validate file size
     */
    private void validateFileSize(MultipartFile file) {
        long size = file.getSize();
        
        if (size < MIN_FILE_SIZE) {
            throw new IllegalArgumentException("File quá nhỏ, có thể bị hỏng (tối thiểu 1KB)");
        }
        
        if (size > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(
                String.format("Kích thước file vượt quá giới hạn cho phép (%.2f MB / 25 MB)", 
                    size / (1024.0 * 1024.0))
            );
        }

        logger.debug("File size validation passed: {} bytes", size);
    }

    /**
     * Validate file name and extension
     */
    private void validateFileName(MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        
        if (originalFilename == null || originalFilename.trim().isEmpty()) {
            throw new IllegalArgumentException("Tên file không hợp lệ");
        }

        // Check for path traversal attacks
        if (originalFilename.contains("..") || originalFilename.contains("/") || originalFilename.contains("\\")) {
            throw new IllegalArgumentException("Tên file chứa ký tự không hợp lệ");
        }

        // Check file extension
        String lowerFilename = originalFilename.toLowerCase();
        if (!lowerFilename.endsWith(".pdf")) {
            throw new IllegalArgumentException("Chỉ chấp nhận file PDF (.pdf)");
        }

        logger.debug("File name validation passed: {}", originalFilename);
    }

    /**
     * Validate MIME type
     */
    private void validateMimeType(MultipartFile file) {
        String contentType = file.getContentType();
        
        if (contentType == null || !ALLOWED_PDF_MIME_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException(
                String.format("Loại file không hợp lệ: %s. Chỉ chấp nhận file PDF", contentType)
            );
        }

        logger.debug("MIME type validation passed: {}", contentType);
    }

    /**
     * Validate file signature (magic number) to prevent fake extensions
     */
    private void validateFileSignature(MultipartFile file) {
        try (InputStream inputStream = file.getInputStream()) {
            byte[] signature = new byte[PDF_SIGNATURE.length];
            int bytesRead = inputStream.read(signature);
            
            if (bytesRead < PDF_SIGNATURE.length) {
                throw new IllegalArgumentException("File không đủ dữ liệu để xác định định dạng");
            }

            if (!Arrays.equals(signature, PDF_SIGNATURE)) {
                throw new IllegalArgumentException(
                    "File không phải là PDF hợp lệ. Vui lòng không đổi tên file để giả mạo định dạng"
                );
            }

            logger.debug("File signature validation passed");
        } catch (IOException e) {
            logger.error("Error reading file signature: {}", e.getMessage());
            throw new RuntimeException("Không thể đọc file để xác thực: " + e.getMessage());
        }
    }

    /**
     * Sanitize filename for storage
     */
    public String sanitizeFilename(String originalFilename) {
        if (originalFilename == null) {
            return "unnamed.pdf";
        }

        // Remove path components
        String filename = originalFilename.replaceAll("[/\\\\]", "");
        
        // Remove special characters, keep only alphanumeric, dash, underscore, and dot
        filename = filename.replaceAll("[^a-zA-Z0-9._-]", "_");
        
        // Ensure it ends with .pdf
        if (!filename.toLowerCase().endsWith(".pdf")) {
            filename += ".pdf";
        }

        return filename;
    }
}
