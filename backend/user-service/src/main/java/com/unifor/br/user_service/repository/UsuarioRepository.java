package com.unifor.br.user_service.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.unifor.br.user_service.model.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    Optional<Usuario> findByEmail(String email);

    Optional<Usuario> findByEmailAndIsActiveTrue(String email);

    Optional<Usuario> findByIdAndIsActiveTrue(UUID id);

    boolean existsByEmail(String email);

    boolean existsByEmailAndIsActiveTrue(String email);

    boolean existsByEmailAndIdNot(String email, UUID id);

    boolean existsByEmailAndIdNotAndIsActiveTrue(String email, UUID id);
}
