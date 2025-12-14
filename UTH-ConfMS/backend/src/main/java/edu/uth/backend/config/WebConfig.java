package edu.uth.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String resolved = (uploadDir == null || uploadDir.isBlank()) ? System.getenv().getOrDefault("APP_UPLOAD_DIR", "uploads") : uploadDir;
        String uploadPath = Path.of(resolved).toAbsolutePath().toUri().toString();
        
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadPath);
    }
}
