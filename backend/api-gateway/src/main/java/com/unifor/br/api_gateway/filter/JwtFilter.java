package com.unifor.br.api_gateway.filter;

import com.unifor.br.api_gateway.util.JwtUtil;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpRequestDecorator;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class JwtFilter implements GlobalFilter, Ordered {

    private final JwtUtil jwtUtil;

    public JwtFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {

        String path = exchange.getRequest().getURI().getPath();
        String method = exchange.getRequest().getMethod().name();

        // Libera rotas públicas e preflight CORS
        if (path.startsWith("/auth") || "OPTIONS".equals(method)) {
            return chain.filter(exchange);
        }

        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        String token = authHeader.substring(7);

        // Valida e extrai claims em um único parse — evita double-parse e NPE na pipeline reativa
        io.jsonwebtoken.Claims claims = jwtUtil.getValidClaims(token).orElse(null);

        if (claims == null) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        // Propaga identidade como headers para os serviços downstream
        String userId = claims.get("userId", String.class);
        String role   = claims.get("role",   String.class);
        String email  = claims.getSubject();

        // Copia todos os headers originais para um novo HttpHeaders mutável e adiciona
        // as identidades JWT. Isso evita o UnsupportedOperationException causado pelo
        // ReadOnlyHttpHeaders do Netty quando o JwtFilter corre antes do RouteToRequestUrlFilter.
        HttpHeaders newHeaders = new HttpHeaders();
        newHeaders.addAll(exchange.getRequest().getHeaders());
        newHeaders.set("X-User-Id",    userId != null ? userId : "");
        newHeaders.set("X-User-Role",  role   != null ? role   : "");
        newHeaders.set("X-User-Email", email  != null ? email  : "");

        ServerHttpRequest mutatedRequest = new ServerHttpRequestDecorator(exchange.getRequest()) {
            @Override
            public HttpHeaders getHeaders() {
                return newHeaders;
            }
        };

        return chain.filter(exchange.mutate().request(mutatedRequest).build());
    }

    @Override
    public int getOrder() {
        return -1;
    }
}
