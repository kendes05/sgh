package com.unifor.br.user_service.controller;

import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.unifor.br.user_service.dto.ChangePasswordRequest;
import com.unifor.br.user_service.dto.LoginRequest;
import com.unifor.br.user_service.dto.LoginResponse;
import com.unifor.br.user_service.dto.RegisterRequest;
import com.unifor.br.user_service.dto.UpdateUserEmailRequest;
import com.unifor.br.user_service.dto.UserResponse;
import com.unifor.br.user_service.exception.UnauthorizedException;
import com.unifor.br.user_service.security.JwtService;
import com.unifor.br.user_service.service.AuthService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;

    @GetMapping("/validate")
    public boolean validateToken(HttpServletRequest request) {
        return jwtService.tokenValido(extractBearerToken(request));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registrar(@RequestBody @Valid RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registrar(request));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody @Valid LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponse> buscarUsuarioPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(authService.buscarPorId(id));
    }

    @PatchMapping("/users/{id}/email")
    public ResponseEntity<?> updateEmail(
            @PathVariable UUID id,
            @RequestBody @Valid UpdateUserEmailRequest request) {
        authService.updateEmail(id, request);
        return ResponseEntity.ok(Map.of("message", "Email atualizado com sucesso."));
    }

    @GetMapping("/users")
    public ResponseEntity<?> listarUsuarios() {
        return ResponseEntity.ok(authService.listarTodos());
    }

    @GetMapping("/users/me")
    public ResponseEntity<?> me(HttpServletRequest request) {
        String token = extractBearerToken(request);
        String email = jwtService.extrairEmail(token);
        return ResponseEntity.ok(authService.buscarPorEmail(email));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deactivateAccount(@PathVariable UUID id) {
        authService.deactivateAccount(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestBody @Valid ChangePasswordRequest request,
            HttpServletRequest httpRequest) {
        String token = extractBearerToken(httpRequest);
        String email = jwtService.extrairEmail(token);
        authService.changePassword(email, request);
        return ResponseEntity.ok(Map.of("message", "Senha alterada com sucesso."));
    }

    private String extractBearerToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("Token ausente ou invalido.");
        }
        return authHeader.substring(7);
    }
}
