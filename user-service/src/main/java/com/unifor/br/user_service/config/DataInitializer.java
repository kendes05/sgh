package com.unifor.br.user_service.config;


import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.unifor.br.user_service.model.Usuario;
import com.unifor.br.user_service.model.Usuario.Role;
import com.unifor.br.user_service.repository.UsuarioRepository;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (usuarioRepository.findByEmail("admin@email.com").isEmpty()) {
            Usuario admin = new Usuario();
            admin.setEmail("admin@email.com");
            admin.setSenha(passwordEncoder.encode("admin123"));
            admin.setRole(Role.admin);
            admin.setIsActive(true);
            admin.setMustChangePassword(true);

            usuarioRepository.save(admin);
            System.out.println("✅ Usuário admin criado com sucesso!");
        } else {
            System.out.println("ℹ️ Usuário admin já existe, pulando criação.");
        }
    }
}