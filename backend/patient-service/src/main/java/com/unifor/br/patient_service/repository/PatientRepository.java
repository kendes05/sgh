package com.unifor.br.patient_service.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.unifor.br.patient_service.model.Patient;

public interface PatientRepository extends JpaRepository<Patient, UUID> {

    Optional<Patient> findByEmail(String email);

    List<Patient> findAllByIsActiveTrue();

    Optional<Patient> findByIdAndIsActiveTrue(UUID id);

    Optional<Patient> findByEmailAndIsActiveTrue(String email);

    boolean existsByEmail(String email);

    boolean existsByEmailAndIsActiveTrue(String email);

    boolean existsByEmailAndIdNot(String email, UUID id);

    boolean existsByEmailAndIdNotAndIsActiveTrue(String email, UUID id);
}
