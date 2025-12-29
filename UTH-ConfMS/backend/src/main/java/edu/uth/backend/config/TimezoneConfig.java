package edu.uth.backend.config;

import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;

import java.util.TimeZone;

/**
 * Cấu hình timezone cho toàn bộ ứng dụng
 * Đặt mặc định là Asia/Ho_Chi_Minh (UTC+7)
 */
@Configuration
public class TimezoneConfig {

    @PostConstruct
    public void init() {
        // Set default timezone cho JVM
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        System.out.println("✅ Application timezone set to: " + TimeZone.getDefault().getID());
    }
}
