package com.unifor.br.patient_service.repository;


import org.springframework.data.jpa.repository.JpaRepository;

import com.unifor.br.patient_service.model.Patient;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PatientRepository extends JpaRepository<Patient, java.util.UUID> {
    Optional<Patient> findByEmail(String email);
    List<Patient> findAllByIsActiveTrue();
    Patient findByIdAndIsActiveTrue(UUID id);

    Patient findByEmailAndIsActiveTrue(String email);

    Boolean existsByEmail(String email);
}