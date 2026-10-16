package com.example.classroom_service.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final Set<String> ALLOWED_ROLES = Set.of("STUDENT", "FACULTY", "ADMIN");

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        // Demo-only identity headers are client-controlled and must not be trusted in production.
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            String role = request.getHeader("X-Demo-Role");
            if (role == null || role.isBlank()) {
                role = "ADMIN";
            }
            if (!ALLOWED_ROLES.contains(role)) {
                response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Unknown demo role");
                return;
            }

            try {
                String userIdHeader = request.getHeader("X-Demo-User-Id");
                String classroomIdHeader = request.getHeader("X-Demo-Classroom-Id");
                UserPrincipal principal = UserPrincipal.builder()
                        .userId(userIdHeader == null || userIdHeader.isBlank()
                                ? 1L : Long.valueOf(userIdHeader))
                        .name(headerOrDefault(request, "X-Demo-Name", "Demo User"))
                        .role(role)
                        .classroomId(classroomIdHeader == null || classroomIdHeader.isBlank()
                                ? 1L : Long.valueOf(classroomIdHeader))
                        .department(headerOrDefault(request, "X-Demo-Department", "CSE"))
                        .build();

                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(
                                principal, null, principal.getAuthorities());

                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (NumberFormatException exception) {
                response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid demo identity");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String headerOrDefault(HttpServletRequest request, String name, String fallback) {
        String value = request.getHeader(name);
        return value == null || value.isBlank() ? fallback : value;
    }
}