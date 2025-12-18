package edu.uth.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Phục vụ các file đã tải lên
        String uploadPath = Path.of(uploadDir).toAbsolutePath().toString();
        registry
            .addResourceHandler("/uploads/**")
            .addResourceLocations("file:" + uploadPath + "/");
    }
}
