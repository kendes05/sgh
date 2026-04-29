package com.unifor.br.user_service.service;


import lombok.RequiredArgsConstructor;

import java.util.HashMap;
import java.util.Map;

import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.unifor.br.user_service.dto.ChangePasswordRequest;
import com.unifor.br.user_service.dto.LoginRequest;
import com.unifor.br.user_service.dto.LoginResponse;
import com.unifor.br.user_service.dto.RegisterRequest;
import com.unifor.br.user_service.dto.UserLoginResponse;
import com.unifor.br.user_service.model.Usuario;
import com.unifor.br.user_service.model.Usuario.Role;
import com.unifor.br.user_service.repository.UsuarioRepository;
import com.unifor.br.user_service.security.JwtService;
import com.unifor.br.user_service.security.PasswordGenerator;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authManager;
    private final PasswordGenerator passwordGenerator;



    // Rota interna
    public Map<String, String> registrar(RegisterRequest request) {
        if (repository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email já cadastrado!");
        }

        Usuario usuario = new Usuario();
        usuario.setNome(request.getNome());
        usuario.setEmail(request.getEmail());
        System.out.println("Usuario recebido: " + request.getEmail() + ", Role: " + request.getRole());
        usuario.setRole(Role.valueOf(request.getRole().toLowerCase()));

        String userPassword = passwordGenerator.gerarSenha();

        usuario.setSenha(passwordEncoder.encode(userPassword));

        repository.save(usuario);

        String Id = repository.findByEmail(request.getEmail()).get().getId().toString();
        Map<String, String> response = new HashMap<>();
        response.put("authUserId", Id);
        response.put("senha", userPassword);

        return response;
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
        return new LoginResponse(token, usuario.getMustChangePassword(), toUserLoginResponse(usuario));
    }

    public void deleteAccount(String email) {
        Usuario usuario = repository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        repository.delete(usuario);
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

    private UserLoginResponse toUserLoginResponse(Usuario usuario) {
        UserLoginResponse response = new UserLoginResponse();
        response.setNome(usuario.getNome());
        response.setEmail(usuario.getEmail());
        response.setRole(usuario.getRole().name());
        return response;
    }
}