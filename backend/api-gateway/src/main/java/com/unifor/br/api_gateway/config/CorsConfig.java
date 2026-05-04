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
        corsConfig.addAllowedOrigin("http://localhost:5173");
        corsConfig.addAllowedOrigin("http://127.0.0.1:5173");
        
        // Permita todos os métodos (incluindo OPTIONS para preflight)
        corsConfig.addAllowedMethod("*");
        
        // Permita todos os headers
        corsConfig.addAllowedHeader("*");
        
        // Credenciais (necessário para Authorization header)
        corsConfig.setAllowCredentials(true);

        // Headers que o frontend pode ler na resposta
        corsConfig.addExposedHeader("Authorization");
        corsConfig.addExposedHeader("X-User-Id");
        corsConfig.addExposedHeader("X-User-Role");
        corsConfig.addExposedHeader("X-User-Email");

        // Cache da requisição preflight
        corsConfig.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfig);
        
        return new CorsWebFilter(source);
    }
}
