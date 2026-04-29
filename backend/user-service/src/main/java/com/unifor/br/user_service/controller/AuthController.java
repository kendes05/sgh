package com.unifor.br.user_service.controller;


import com.unifor.br.user_service.dto.ChangePasswordRequest;
import com.unifor.br.user_service.dto.LoginRequest;
import com.unifor.br.user_service.dto.LoginResponse;
import com.unifor.br.user_service.dto.RegisterRequest;
import com.unifor.br.user_service.security.JwtService;
import com.unifor.br.user_service.service.AuthService;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;

    @GetMapping("/validate")
    public boolean validateToken(HttpServletRequest httpRequest) {
        String token = httpRequest.getHeader("Authorization").substring(7);
        boolean isValid = jwtService.tokenValido(token);
        return isValid;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registrar(@RequestBody RegisterRequest request) {
        Map<String, String> response = authService.registrar(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/delete-account")
    public ResponseEntity<?> deleteAccount(@RequestBody String email) {
        authService.deleteAccount(email);
        return ResponseEntity.ok("Conta deletada com sucesso");
    }

    @PatchMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request, HttpServletRequest httpRequest) {
        String token = httpRequest.getHeader("Authorization").substring(7);
        String email = jwtService.extrairEmail(token);
        authService.changePassword(email, request);
        return ResponseEntity.ok("Senha alterada com sucesso");
    }
}