package com.unifor.br.patient_service.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.unifor.br.patient_service.model.Patient;

public interface PatientRepository extends JpaRepository<Patient, UUID> {

    // --- Email ---
    Optional<Patient> findByEmail(String email);
    Optional<Patient> findByEmailAndIsActiveTrue(String email);
    boolean existsByEmail(String email);
    boolean existsByEmailAndIsActiveTrue(String email);
    boolean existsByEmailAndIdNot(String email, UUID id);
    boolean existsByEmailAndIdNotAndIsActiveTrue(String email, UUID id);

    // --- CPF ---
    Optional<Patient> findByCpfAndIsActiveTrue(String cpf);
    boolean existsByCpf(String cpf);
    boolean existsByCpfAndIdNot(String cpf, UUID id);

    // --- Geral ---
    List<Patient> findAllByIsActiveTrue();
    Optional<Patient> findByIdAndIsActiveTrue(UUID id);

    // --- Stats ---
    long countByIsActiveTrue();
    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}
