package com.example.classroom_service.config;

import com.example.classroom_service.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity           // enables @PreAuthorize on controllers
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public — health check
                .requestMatchers("/actuator/health").permitAll()

                // Classrooms — admins create/update; everyone authenticated can read
                .requestMatchers(HttpMethod.POST,   "/api/classrooms/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/api/classrooms/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/classrooms/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET,    "/api/classrooms/**").authenticated()

                // Timetable — faculty/admin write; all authenticated read
                .requestMatchers(HttpMethod.POST,   "/api/timetable/**").hasAnyRole("FACULTY","ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/api/timetable/**").hasAnyRole("FACULTY","ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/timetable/**").hasAnyRole("FACULTY","ADMIN")
                .requestMatchers(HttpMethod.GET,    "/api/timetable/**").authenticated()

                // Announcements — faculty/admin write; all authenticated read
                .requestMatchers(HttpMethod.POST,   "/api/announcements/**").hasAnyRole("FACULTY","ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/api/announcements/**").hasAnyRole("FACULTY","ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/announcements/**").hasAnyRole("FACULTY","ADMIN")
                .requestMatchers(HttpMethod.GET,    "/api/announcements/**").authenticated()

                // Resources — faculty/admin upload; all authenticated read/download
                .requestMatchers(HttpMethod.POST,   "/api/resources/**").hasAnyRole("FACULTY","ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/api/resources/**").hasAnyRole("FACULTY","ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/resources/**").hasAnyRole("FACULTY","ADMIN")
                .requestMatchers(HttpMethod.GET,    "/api/resources/**").authenticated()

                // Academic events — faculty/admin write; all authenticated read
                .requestMatchers(HttpMethod.POST,   "/api/events/**").hasAnyRole("FACULTY","ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/api/events/**").hasAnyRole("FACULTY","ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/events/**").hasAnyRole("FACULTY","ADMIN")
                .requestMatchers(HttpMethod.GET,    "/api/events/**").authenticated()

                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
