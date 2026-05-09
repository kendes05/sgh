package com.unifor.br.doctor_service.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.unifor.br.doctor_service.client.AuthClient;
import com.unifor.br.doctor_service.client.AuthRequest;
import com.unifor.br.doctor_service.client.AuthResponse;
import com.unifor.br.doctor_service.dto.DoctorRequest;
import com.unifor.br.doctor_service.dto.DoctorResponse;
import com.unifor.br.doctor_service.exception.ConflictException;
import com.unifor.br.doctor_service.exception.ResourceNotFoundException;
import com.unifor.br.doctor_service.model.Doctor;
import com.unifor.br.doctor_service.repository.DoctorRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DoctorService {

    private final DoctorRepository repository;
    private final AuthClient authClient;
    private final EmailService emailService;

    @Transactional
    public DoctorResponse registerDoctor(DoctorRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        if (repository.existsByEmail(normalizedEmail)) {
            throw new ConflictException("Ja existe um profissional com este e-mail.");
        }
        if (repository.existsByCrmCoren(request.getCrmCoren().trim())) {
            throw new ConflictException("Ja existe um profissional com este CRM/COREN.");
        }

        // Envia a role correta para o auth-service (medic ou nurse)
        AuthResponse authResponse = authClient.register(
                new AuthRequest(normalizedEmail, request.getNome().trim(),
                        request.getRole().name()));

        try {
            Doctor doctor = Doctor.builder()
                    .email(normalizedEmail)
                    .userAuthId(authResponse.authUserId())
                    .nome(request.getNome().trim())
                    .telefone(request.getTelefone().trim())
                    .sexo(request.getSexo())
                    .especialidadePrincipal(request.getEspecialidadePrincipal().trim())
                    .crmCoren(request.getCrmCoren().trim())
                    .role(request.getRole())
                    .isActive(true)
                    .build();

            Doctor saved = repository.save(doctor);

            emailService.enviarEmail(
                    normalizedEmail,
                    "Bem-vindo ao SGH",
                    saved.getNome(),
                    "Sua senha temporaria e: " + authResponse.senha());

            return toResponse(saved);
        } catch (RuntimeException ex) {
            authClient.deactivateAccount(UUID.fromString(authResponse.authUserId()));
            throw ex;
        }
    }

    @Transactional(readOnly = true)
    public List<DoctorResponse> listDoctors() {
        return repository.findAllByIsActiveTrue().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DoctorResponse> getDoctorsByRole(String role) {
        Doctor.Role doctorRole;
        try {
            doctorRole = Doctor.Role.valueOf(role.toLowerCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Role invalida: " + role + ". Use 'medic' ou 'nurse'.");
        }
        return repository.findByRoleAndIsActiveTrue(doctorRole).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public DoctorResponse getDoctorById(UUID id) {
        Doctor doctor = getActiveDoctor(id);
        return toResponse(doctor);
    }

    @Transactional
    public DoctorResponse updateDoctor(UUID id, DoctorRequest request) {
        Doctor doctor = getActiveDoctor(id);

        if (request.getNome() != null) {
            doctor.setNome(request.getNome().trim());
        }
        if (request.getCrmCoren() != null) {
            String normalizedCrm = request.getCrmCoren().trim();
            if (repository.existsByCrmCorenAndIdNot(normalizedCrm, id)) {
                throw new ConflictException("Ja existe um profissional com este CRM/COREN.");
            }
            doctor.setCrmCoren(normalizedCrm);
        }
        if (request.getSexo() != null) {
            doctor.setSexo(request.getSexo());
        }
        if (request.getEmail() != null) {
            String normalizedEmail = request.getEmail().trim().toLowerCase();
            if (repository.existsByEmailAndIdNot(normalizedEmail, id)) {
                throw new ConflictException("Ja existe um profissional com este e-mail.");
            }
            doctor.setEmail(normalizedEmail);
        }
        if (request.getTelefone() != null) {
            doctor.setTelefone(request.getTelefone().trim());
        }
        if (request.getEspecialidadePrincipal() != null) {
            doctor.setEspecialidadePrincipal(request.getEspecialidadePrincipal().trim());
        }

        return toResponse(repository.save(doctor));
    }

    @Transactional
    public void deleteDoctor(UUID id) {
        Doctor doctor = getActiveDoctor(id);
        doctor.setIsActive(false);
        repository.save(doctor);
        authClient.deactivateAccount(UUID.fromString(doctor.getUserAuthId()));
    }

    // -------------------------------------------------------
    // Helpers
    // -------------------------------------------------------

    private Doctor getActiveDoctor(UUID id) {
        return repository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Profissional nao encontrado."));
    }

    private DoctorResponse toResponse(Doctor doctor) {
        DoctorResponse response = new DoctorResponse();
        response.setId(doctor.getId());
        response.setNome(doctor.getNome());
        response.setCrmCoren(doctor.getCrmCoren());
        response.setSexo(doctor.getSexo());
        response.setEmail(doctor.getEmail());
        response.setTelefone(doctor.getTelefone());
        response.setEspecialidadePrincipal(doctor.getEspecialidadePrincipal());
        response.setRole(doctor.getRole());
        response.setIsActive(doctor.getIsActive());
        return response;
    }
}
