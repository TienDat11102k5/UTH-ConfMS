package edu.uth.backend.common;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Component
public class FileStorageUtil {

    private static final Logger logger = LoggerFactory.getLogger(FileStorageUtil.class);

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    // Hàm lưu file vào thư mục chỉ định
    public String saveFile(MultipartFile file, String subFolder) {
        String resolved = (uploadDir == null || uploadDir.isBlank()) ? System.getenv().getOrDefault("APP_UPLOAD_DIR", "uploads") : uploadDir;
        Path rootLocation = Path.of(resolved, subFolder);

        String original = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
        String fileName = UUID.randomUUID().toString() + "_" + original;

        try {
            if (!Files.exists(rootLocation)) {
                Files.createDirectories(rootLocation);
                logger.info("Đã tạo thư mục upload: {}", rootLocation.toAbsolutePath());
            }

            Path target = rootLocation.resolve(fileName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            logger.info("Đã lưu file tải lên tại {} (kích thước: {} bytes)", target.toAbsolutePath(), file.getSize());
            return fileName;
        } catch (IOException e) {
            logger.error("Lỗi khi lưu file lên {}: {}", rootLocation, e.getMessage());
            throw new RuntimeException("Lỗi hệ thống khi lưu file: " + e.getMessage());
        }
    }

    // Xóa file nếu tồn tại
    public void deleteFile(String fileName, String subFolder) {
        if (fileName == null || fileName.isBlank()) return;
        Path rootLocation = Path.of(uploadDir, subFolder);
        try {
            Path target = rootLocation.resolve(fileName);
            if (Files.exists(target)) {
                Files.delete(target);
                logger.info("Đã xóa file {}", target.toAbsolutePath());
            }
        } catch (IOException e) {
            logger.warn("Xóa file {} thất bại: {}", fileName, e.getMessage());
        }
    }
}