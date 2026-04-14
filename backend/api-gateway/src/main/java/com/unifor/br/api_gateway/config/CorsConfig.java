package com.unifor.br.api_gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

@Configuration
public class CorsConfig {
    
    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration corsConfig = new CorsConfiguration();
        
        // IMPORTANTE: Adicione AMBAS as origens
        corsConfig.addAllowedOrigin("http://localhost:5500");
        corsConfig.addAllowedOrigin("http://127.0.0.1:5500");
        
        // Permita todos os métodos (incluindo OPTIONS para preflight)
        corsConfig.addAllowedMethod("*");
        
        // Permita todos os headers
        corsConfig.addAllowedHeader("*");
        
        // Se você está enviando cookies ou Authorization header
        corsConfig.setAllowCredentials(true);
        
        // Headers que o frontend pode ler
        corsConfig.addExposedHeader("*");
        
        // Cache da requisição preflight
        corsConfig.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfig);
        
        return new CorsWebFilter(source);
    }
}