package com.unifor.br.user_service.repository;


import org.springframework.data.jpa.repository.JpaRepository;

import com.unifor.br.user_service.model.Usuario;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, java.util.UUID> {
    Optional<Usuario> findByEmail(String email);
}