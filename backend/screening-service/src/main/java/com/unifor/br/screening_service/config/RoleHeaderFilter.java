package com.unifor.br.screening_service.config;

import java.io.IOException;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Lê o header X-User-Role propagado pelo gateway e registra a role
 * no contexto de segurança do Spring, permitindo o uso de @PreAuthorize.
 */
@Component
public class RoleHeaderFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String role = request.getHeader("X-User-Role");
        if (role != null && !role.isBlank()) {
            var authority = new SimpleGrantedAuthority("ROLE_" + role.trim().toUpperCase());
            var auth = new UsernamePasswordAuthenticationToken("gateway-user", null, List.of(authority));
            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        filterChain.doFilter(request, response);
    }
}
