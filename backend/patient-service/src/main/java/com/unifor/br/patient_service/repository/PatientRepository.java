package com.unifor.br.patient_service.repository;


import org.springframework.data.jpa.repository.JpaRepository;

import com.unifor.br.patient_service.model.Patient;


import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, java.util.UUID> {
    Optional<Patient> findByEmail(String email);
}