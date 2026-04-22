package com.unifor.br.doctor_service.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.unifor.br.doctor_service.model.Doctor;

public interface DoctorRepository extends JpaRepository<Doctor, UUID> {
    boolean existsByEmail(String email);

    // filtrar pela Role
    List<Doctor> findByRole(Doctor.Role role);

}