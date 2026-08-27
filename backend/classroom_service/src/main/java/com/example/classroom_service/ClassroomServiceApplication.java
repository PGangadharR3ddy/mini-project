package com.example.classroom_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.nio.file.Paths;

@SpringBootApplication
public class ClassroomServiceApplication {

    public static void main(String[] args) {
        loadEnv();
        SpringApplication.run(ClassroomServiceApplication.class, args);
    }

    private static void loadEnv() {
        // Look for .env in the project root (where pom.xml lives)
        String envPath = Paths.get(".env").toAbsolutePath().toString();
        try (BufferedReader reader = new BufferedReader(new FileReader(envPath))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                // Skip comments and empty lines
                if (line.isEmpty() || line.startsWith("#")) continue;
                int eq = line.indexOf('=');
                if (eq < 0) continue;
                String key   = line.substring(0, eq).trim();
                String value = line.substring(eq + 1).trim();
                // Only set if not already set by the OS environment
                if (System.getProperty(key) == null && System.getenv(key) == null) {
                    System.setProperty(key, value);
                }
            }
        } catch (IOException e) {
            System.out.println("[INFO] No .env file found at " + envPath + " — using system environment variables.");
        }
    }
}