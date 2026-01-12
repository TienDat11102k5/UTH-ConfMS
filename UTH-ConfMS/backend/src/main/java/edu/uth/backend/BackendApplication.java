package edu.uth.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import java.util.TimeZone;
import jakarta.annotation.PostConstruct;

@SpringBootApplication
public class BackendApplication {

	@PostConstruct
	public void init() {
		// Set JVM timezone to Vietnam (UTC+7)
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
		System.out.println("Application timezone set to: " + TimeZone.getDefault().getID());
	}

	public static void main(String[] args) {
		// Also set timezone before Spring starts
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
		SpringApplication.run(BackendApplication.class, args);
	}

}