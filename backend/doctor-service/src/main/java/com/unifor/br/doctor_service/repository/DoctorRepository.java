package com.unifor.br.doctor_service.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.unifor.br.doctor_service.model.Doctor;

public interface DoctorRepository extends JpaRepository<Doctor, UUID> {
    boolean existsByEmail(String email);
}