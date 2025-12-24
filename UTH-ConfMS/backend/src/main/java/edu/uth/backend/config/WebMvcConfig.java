package edu.uth.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;


@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private static final Logger logger = LoggerFactory.getLogger(WebMvcConfig.class);

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Phục vụ các file đã tải lên
        String resolvedDir = (uploadDir == null || uploadDir.isBlank()) 
            ? "uploads" 
            : uploadDir;
        
        File uploadFolder = new File(resolvedDir);
        if (!uploadFolder.isAbsolute()) {
            uploadFolder = new File(System.getProperty("user.dir"), resolvedDir);
        }
        
        String uploadPath = uploadFolder.toURI().toString();
        
        logger.info("Configuring static resource handler for /uploads/** -> {}", uploadPath);
        logger.info("Upload directory exists: {}, isDirectory: {}", 
            uploadFolder.exists(), uploadFolder.isDirectory());
        
        registry
            .addResourceHandler("/uploads/**")
            .addResourceLocations(uploadPath);
    }
}
