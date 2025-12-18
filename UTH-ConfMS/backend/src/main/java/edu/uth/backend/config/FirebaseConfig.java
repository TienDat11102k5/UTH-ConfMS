package edu.uth.backend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.InputStream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FirebaseConfig {

  @Value("${app.firebase.service-account:}")
  private String serviceAccountPath;

  // Backward-compat: nếu app.firebase.service-account không được set,
  // dùng app.firebase.credentials (đã khai báo trong application.properties).
  @Value("${app.firebase.credentials:}")
  private String credentialsPath;

  @PostConstruct
  public void initFirebase() throws Exception {
    if (FirebaseApp.getApps() != null && !FirebaseApp.getApps().isEmpty()) return;
    String path = (serviceAccountPath != null && !serviceAccountPath.isBlank())
        ? serviceAccountPath
        : credentialsPath;

    if (path == null || path.isBlank()) {
      // Không init nếu bạn chưa cấu hình; đăng nhập Google sẽ thất bại -> đây là hành vi mong muốn
      System.out.println("⚠️ Chưa cấu hình credentials Firebase. Đăng nhập Google sẽ bị vô hiệu hóa.");
      return;
    }

    // Kiểm tra file tồn tại
    java.io.File credFile = new java.io.File(path);
    if (!credFile.exists()) {
      System.out.println("⚠️ Không tìm thấy tệp credentials Firebase: " + credFile.getAbsolutePath());
      System.out.println("⚠️ Đăng nhập Google sẽ bị vô hiệu hóa.");
      return;
    }

    try (InputStream is = new FileInputStream(path)) {
      FirebaseOptions options = FirebaseOptions.builder()
          .setCredentials(GoogleCredentials.fromStream(is))
          .build();
      FirebaseApp.initializeApp(options);
      System.out.println("✅ Firebase khởi tạo thành công");
    } catch (Exception e) {
      System.err.println("⚠️ Khởi tạo Firebase thất bại: " + e.getMessage());
      System.err.println("⚠️ Đăng nhập Google sẽ bị vô hiệu hóa.");
      // Không ném ngoại lệ - cho phép ứng dụng khởi động mà không có Firebase
    }
  }
}
