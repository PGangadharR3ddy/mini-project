package com.example.classroom_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestTemplateConfig {

    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        // Connect timeout: 10 seconds
        factory.setConnectTimeout(10_000);
        // Read timeout: 5 minutes (LLM responses are slow)
        factory.setReadTimeout(300_000);
        return new RestTemplate(factory);
    }
}