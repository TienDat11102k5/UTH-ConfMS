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

  @PostConstruct
  public void initFirebase() throws Exception {
    if (FirebaseApp.getApps() != null && !FirebaseApp.getApps().isEmpty()) return;
    if (serviceAccountPath == null || serviceAccountPath.isBlank()) {
      // Không init nếu bạn chưa cấu hình; Google login sẽ fail -> đúng hành vi
      return;
    }

    try (InputStream is = new FileInputStream(serviceAccountPath)) {
      FirebaseOptions options = FirebaseOptions.builder()
          .setCredentials(GoogleCredentials.fromStream(is))
          .build();
      FirebaseApp.initializeApp(options);
    }
  }
}
