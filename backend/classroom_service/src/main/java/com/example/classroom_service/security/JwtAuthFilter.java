package com.example.classroom_service.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        try {
            String token = extractToken(request);

            if (token != null && jwtUtil.validateToken(token)) {
                Claims claims = jwtUtil.extractAllClaims(token);

                // Extract userId from subject
                Long userId = Long.valueOf(claims.getSubject());

                // Extract role — must exist
                String role = claims.get("role", String.class);

                // Extract optional fields safely
                String name = claims.get("name", String.class);
                String dept = claims.get("department", String.class);

                // classroomId is optional (null for FACULTY/ADMIN)
                Long classroomId = null;
                Object cIdObj = claims.get("classroomId");
                if (cIdObj != null) {
                    classroomId = Long.valueOf(cIdObj.toString());
                }

                System.out.println("DEBUG >>> userId=" + userId
                        + " role=" + role
                        + " name=" + name
                        + " dept=" + dept
                        + " classroomId=" + classroomId);

                UserPrincipal principal = UserPrincipal.builder()
                        .userId(userId)
                        .name(name)
                        .role(role)
                        .classroomId(classroomId)
                        .department(dept)
                        .build();

                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(
                                principal, null, principal.getAuthorities());

                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        } catch (Exception e) {
            // Log the error but don't block the filter chain
            System.out.println("DEBUG >>> JwtAuthFilter error: " + e.getMessage());
            e.printStackTrace();
        }

        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            return header.substring(7).trim();
        }
        return null;
    }
}
