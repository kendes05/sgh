package com.unifor.br.doctor_service.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.unifor.br.doctor_service.model.Doctor;

public interface DoctorRepository extends JpaRepository<Doctor, UUID> {

    // --- Listagens ---
    List<Doctor> findAllByIsActiveTrue();
    List<Doctor> findByRoleAndIsActiveTrue(Doctor.Role role);

    // --- Buscas por ID ---
    Optional<Doctor> findByIdAndIsActiveTrue(UUID id);

    // --- Email ---
    boolean existsByEmail(String email);
    boolean existsByEmailAndIsActiveTrue(String email);
    boolean existsByEmailAndIdNot(String email, UUID id);

    // --- CRM/COREN ---
    boolean existsByCrmCoren(String crmCoren);
    boolean existsByCrmCorenAndIdNot(String crmCoren, UUID id);

    // --- Auth ---
    Optional<Doctor> findByUserAuthIdAndIsActiveTrue(String userAuthId);
}
