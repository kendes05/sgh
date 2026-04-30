package com.unifor.br.user_service.service;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.unifor.br.user_service.dto.ChangePasswordRequest;
import com.unifor.br.user_service.dto.LoginRequest;
import com.unifor.br.user_service.dto.LoginResponse;
import com.unifor.br.user_service.dto.RegisterRequest;
import com.unifor.br.user_service.dto.UpdateUserEmailRequest;
import com.unifor.br.user_service.dto.UserLoginResponse;
import com.unifor.br.user_service.exception.BusinessException;
import com.unifor.br.user_service.exception.ConflictException;
import com.unifor.br.user_service.exception.ResourceNotFoundException;
import com.unifor.br.user_service.model.Usuario;
import com.unifor.br.user_service.model.Usuario.Role;
import com.unifor.br.user_service.repository.UsuarioRepository;
import com.unifor.br.user_service.security.JwtService;
import com.unifor.br.user_service.security.PasswordGenerator;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authManager;
    private final PasswordGenerator passwordGenerator;

    @Transactional
    public Map<String, String> registrar(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (repository.existsByEmail(normalizedEmail)) {
            throw new ConflictException("Email ja cadastrado.");
        }

        Usuario usuario = new Usuario();
        usuario.setNome(request.getNome().trim());
        usuario.setEmail(normalizedEmail);
        usuario.setRole(parseRole(request.getRole()));

        String userPassword = passwordGenerator.gerarSenha();
        usuario.setSenha(passwordEncoder.encode(userPassword));

        Usuario saved = repository.save(usuario);

        Map<String, String> response = new HashMap<>();
        response.put("authUserId", saved.getId().toString());
        response.put("senha", userPassword);
        return response;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        try {
            authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(normalizedEmail, request.getSenha()));
        } catch (BadCredentialsException ex) {
            throw new BusinessException("Email ou senha incorretos.");
        }

        Usuario usuario = repository.findByEmailAndIsActiveTrue(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario nao encontrado ou inativo."));

        String token = jwtService.gerarToken(normalizedEmail);
        return new LoginResponse(token, usuario.getMustChangePassword(), toUserLoginResponse(usuario));
    }

    @Transactional
    public void deactivateAccount(UUID userId) {
        Usuario usuario = repository.findByIdAndIsActiveTrue(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario nao encontrado ou ja inativo."));

        usuario.setIsActive(false);
        repository.save(usuario);
    }

    @Transactional
    public void updateEmail(UUID userId, UpdateUserEmailRequest request) {
        Usuario usuario = repository.findByIdAndIsActiveTrue(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario nao encontrado ou inativo."));

        String normalizedEmail = request.email().trim().toLowerCase();
        if (repository.existsByEmailAndIdNot(normalizedEmail, userId)) {
            throw new ConflictException("Ja existe usuario com este email.");
        }

        usuario.setEmail(normalizedEmail);
        repository.save(usuario);
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        Usuario usuario = repository.findByEmailAndIsActiveTrue(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario nao encontrado ou inativo."));

        if (!passwordEncoder.matches(request.getSenhaAtual(), usuario.getSenha())) {
            throw new BusinessException("Senha atual incorreta.");
        }

        if (!request.getNovaSenha().equals(request.getConfirmarNovaSenha())) {
            throw new BusinessException("As senhas nao coincidem.");
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

    private Role parseRole(String rawRole) {
        try {
            return Role.valueOf(rawRole.trim().toLowerCase());
        } catch (IllegalArgumentException ex) {
            throw new BusinessException("Role invalida.");
        }
    }
}
