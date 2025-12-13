package edu.uth.backend.common;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Component
public class FileStorageUtil {

    // Hàm lưu file vào thư mục chỉ định
    public String saveFile(MultipartFile file, String subFolder) {
        // Tạo đường dẫn: uploads/subFolder (ví dụ: uploads/submissions)
        Path rootLocation = Path.of("uploads/" + subFolder);
        
        // Tạo tên file ngẫu nhiên: UUID_tenfilegoc.pdf
        String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        
        try {
            if (!Files.exists(rootLocation)) Files.createDirectories(rootLocation);
            Files.copy(file.getInputStream(), rootLocation.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);
            return fileName;
        } catch (IOException e) {
            throw new RuntimeException("Lỗi hệ thống khi lưu file: " + e.getMessage());
        }
    }
}