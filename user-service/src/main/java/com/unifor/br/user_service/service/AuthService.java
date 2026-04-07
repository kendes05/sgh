package com.unifor.br.user_service.service;


import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.unifor.br.user_service.dto.ChangePasswordRequest;
import com.unifor.br.user_service.dto.LoginRequest;
import com.unifor.br.user_service.dto.LoginResponse;
import com.unifor.br.user_service.dto.RegisterRequest;
import com.unifor.br.user_service.model.Usuario;
import com.unifor.br.user_service.repository.UsuarioRepository;
import com.unifor.br.user_service.security.JwtService;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authManager;

    public String registrar(RegisterRequest request) {
        if (repository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email já cadastrado!");
        }

        Usuario usuario = new Usuario();
        usuario.setNome(request.getNome());
        usuario.setEmail(request.getEmail());
        usuario.setSenha(passwordEncoder.encode(request.getSenha()));

        repository.save(usuario);
        return jwtService.gerarToken(request.getEmail());
    }

    public LoginResponse login(LoginRequest request) {
        try {
            authManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getSenha())
            );
        } catch (BadCredentialsException e) {
            throw new RuntimeException("Email ou senha incorretos");
        }

        Usuario usuario = repository.findByEmail(request.getEmail())
            .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        String token = jwtService.gerarToken(request.getEmail());
        return new LoginResponse(token, usuario.getMustChangePassword());
    }

    public void changePassword(String email, ChangePasswordRequest request) {
            Usuario usuario = repository.findByEmail(email)
        .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        if (!passwordEncoder.matches(request.getSenhaAtual(), usuario.getSenha())) {
            throw new RuntimeException("Senha atual incorreta");
        }

        if (!request.getNovaSenha().equals(request.getConfirmarNovaSenha())) {
            throw new RuntimeException("As senhas não coincidem");
    }

        usuario.setSenha(passwordEncoder.encode(request.getNovaSenha()));
        usuario.setMustChangePassword(false);
        repository.save(usuario);

    }
}