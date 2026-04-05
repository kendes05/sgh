package com.unifor.br.user_service.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.security.Key;
import java.util.Date;

@Service
public class JwtService {

    
    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiracao;

    private Key getKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    @PostConstruct
    public void init() {
        System.out.println(">>> JWT SECRET carregado: " + secret);
        System.out.println(">>> JWT EXPIRATION carregado: " + expiracao);
    }

    public String gerarToken(String email) {
        return Jwts.builder()
            .setSubject(email)
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + expiracao))
            .signWith(getKey(), SignatureAlgorithm.HS256)
            .compact();
    }

    public String extrairEmail(String token) {
        return Jwts.parserBuilder()
            .setSigningKey(getKey())
            .build()
            .parseClaimsJws(token)
            .getBody()
            .getSubject();
    }

    public boolean tokenValido(String token) {
        try {
            extrairEmail(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }
}