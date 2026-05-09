package com.unifor.br.api_gateway.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtUtil {

    private final String secret;

    public JwtUtil(@Value("${jwt.secret}") String secret) {
        this.secret = secret;
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * Valida o token e retorna os claims em uma única operação de parse.
     * Retorna Optional.empty() se o token for inválido, expirado ou malformado.
     */
    public java.util.Optional<Claims> getValidClaims(String token) {
        try {
            Claims claims = getClaims(token);
            if (claims.getExpiration() == null || claims.getExpiration().before(new Date())) {
                return java.util.Optional.empty();
            }
            return java.util.Optional.of(claims);
        } catch (Exception e) {
            System.out.println("❌ Token inválido [" + e.getClass().getSimpleName() + "]: " + e.getMessage());
            return java.util.Optional.empty();
        }
    }

    /** @deprecated use getValidClaims() para evitar double-parse */
    public boolean isTokenValid(String token) {
        return getValidClaims(token).isPresent();
    }

    public String extractEmail(String token) {
        return getClaims(token).getSubject();
    }

    public String extractUserId(String token) {
        return getClaims(token).get("userId", String.class);
    }

    public String extractRole(String token) {
        return getClaims(token).get("role", String.class);
    }
}
