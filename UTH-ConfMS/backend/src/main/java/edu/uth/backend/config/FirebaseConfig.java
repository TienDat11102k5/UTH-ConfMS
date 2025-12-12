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
      // Không init nếu bạn chưa cấu hình; Google login sẽ fail -> đúng hành vi
      return;
    }

    try (InputStream is = new FileInputStream(path)) {
      FirebaseOptions options = FirebaseOptions.builder()
          .setCredentials(GoogleCredentials.fromStream(is))
          .build();
      FirebaseApp.initializeApp(options);
    }
  }
}
