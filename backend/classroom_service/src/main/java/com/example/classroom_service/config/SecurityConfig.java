package com.example.classroom_service.config;

import com.example.classroom_service.security.JwtAuthFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            throw new UsernameNotFoundException("Auth disabled for testing.");
        };
    }

    @Bean
    public FilterRegistrationBean<JwtAuthFilter> jwtAuthFilterRegistration(
            JwtAuthFilter jwtAuthFilter) {
        FilterRegistrationBean<JwtAuthFilter> registration =
                new FilterRegistrationBean<>(jwtAuthFilter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http,
            CorsConfigurationSource corsConfigurationSource,
            JwtAuthFilter jwtAuthFilter) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.POST, "/api/projects/join-request")
                    .hasRole("STUDENT")
                .requestMatchers(HttpMethod.POST, "/api/classrooms/**")
                    .hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/classrooms/**")
                    .hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/classrooms/**")
                    .hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/announcements/**", "/api/events/**",
                        "/api/resources/**", "/api/timetable/**")
                    .hasAnyRole("FACULTY", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/announcements/**", "/api/events/**",
                        "/api/resources/**", "/api/timetable/**")
                    .hasAnyRole("FACULTY", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/announcements/**", "/api/events/**",
                        "/api/resources/**", "/api/timetable/**")
                    .hasAnyRole("FACULTY", "ADMIN")
                .anyRequest().permitAll()
            );

        return http.build();
    }
}