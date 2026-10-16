package com.example.classroom_service.client;

import com.example.classroom_service.dto.StudyAssistantDTO;
import com.example.classroom_service.exception.FileStorageException;
import com.example.classroom_service.exception.ResourceNotFoundException;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class StudyAssistantClient {

    @Value("${study.assistant.url:http://localhost:8000}")
    private String baseUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    // ─── Upload PDF to FastAPI ────────────────────────────────────────────────

    public Map<String, Object> uploadDocument(MultipartFile file) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", fileResource);

            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    baseUrl + "/documents",
                    HttpMethod.POST,
                    request,
                    Map.class
            );

            return response.getBody();

        } catch (HttpClientErrorException e) {
            log.error("FastAPI upload error: {}", e.getResponseBodyAsString());
            throw new FileStorageException("PDF upload failed: " + extractDetail(e));
        } catch (ResourceAccessException e) {
            log.error("FastAPI unreachable: {}", e.getMessage());
            throw new FileStorageException(
                    "AI service is unavailable. Make sure FastAPI is running on " + baseUrl);
        } catch (Exception e) {
            log.error("Unexpected upload error: {}", e.getMessage());
            throw new FileStorageException("Failed to upload PDF: " + e.getMessage());
        }
    }

    // ─── Ask a question about a document ─────────────────────────────────────

    public Map<String, Object> askQuestion(String documentId, String question) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> body = Map.of("question", question);

            HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    baseUrl + "/documents/" + documentId + "/ask",
                    HttpMethod.POST,
                    request,
                    Map.class
            );

            return response.getBody();

        } catch (HttpClientErrorException.NotFound e) {
            throw new ResourceNotFoundException(
                    "Document not found in AI service. Please re-upload the PDF.");
        } catch (HttpClientErrorException e) {
            log.error("FastAPI ask error: {}", e.getResponseBodyAsString());
            throw new FileStorageException("Question failed: " + extractDetail(e));
        } catch (ResourceAccessException e) {
            throw new FileStorageException(
                    "AI service is unavailable. Make sure FastAPI is running on " + baseUrl);
        } catch (Exception e) {
            log.error("Unexpected ask error: {}", e.getMessage());
            throw new FileStorageException("Failed to get answer: " + e.getMessage());
        }
    }

    // ─── Study mode (summary + quiz) ─────────────────────────────────────────

    public Map<String, Object> studyPdf(MultipartFile file) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", fileResource);

            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    baseUrl + "/study",
                    HttpMethod.POST,
                    request,
                    Map.class
            );

            return response.getBody();

        } catch (HttpClientErrorException e) {
            log.error("FastAPI study error: {}", e.getResponseBodyAsString());
            throw new FileStorageException("Study mode failed: " + extractDetail(e));
        } catch (ResourceAccessException e) {
            throw new FileStorageException(
                    "AI service is unavailable. Make sure FastAPI is running on " + baseUrl);
        } catch (Exception e) {
            log.error("Unexpected study error: {}", e.getMessage());
            throw new FileStorageException("Study mode failed: " + e.getMessage());
        }
    }

    // ─── Health check ─────────────────────────────────────────────────────────

    public Map<String, Object> health() {
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(
                    baseUrl + "/health", Map.class);
            return response.getBody();
        } catch (HttpStatusCodeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("ollama_connected", false);
            error.put("model_installed", false);
            error.put("error", e.getResponseBodyAsString());
            return error;
        } catch (ResourceAccessException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("ollama_connected", false);
            error.put("model_installed", false);
            error.put("error", "AI service unreachable: " + e.getMessage());
            return error;
        }
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    private String extractDetail(HttpClientErrorException e) {
        try {
            Map body = objectMapper.readValue(e.getResponseBodyAsString(), Map.class);
            return body.getOrDefault("detail", e.getMessage()).toString();
        } catch (Exception ex) {
            return e.getMessage();
        }
    }
}