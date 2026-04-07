package com.unifor.br.user_service.security;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import com.unifor.br.user_service.repository.UsuarioRepository;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return usuarioRepository.findByEmail(email)
            .map(u -> User.withUsername(u.getEmail())
                .password(u.getSenha()) 
                .roles("USER")
                .build())
            .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado"));
    }
}