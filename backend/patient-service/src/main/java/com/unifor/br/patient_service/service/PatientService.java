package com.unifor.br.patient_service.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.unifor.br.patient_service.client.AuthClient;
import com.unifor.br.patient_service.client.AuthRequest;
import com.unifor.br.patient_service.client.AuthResponse;
import com.unifor.br.patient_service.client.UpdateUserEmailRequest;
import com.unifor.br.patient_service.dto.PatientRequest;
import com.unifor.br.patient_service.dto.PatientResponse;
import com.unifor.br.patient_service.dto.PatientUpdateRequest;
import com.unifor.br.patient_service.model.Patient;
import com.unifor.br.patient_service.exception.*;
import com.unifor.br.patient_service.repository.PatientRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository repository;
    private final AuthClient authClient;
    private final EmailService emailService;

    @Transactional
    public PatientResponse registrar(PatientRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        if (repository.existsByEmail(normalizedEmail)) {
            throw new ConflictException("Ja existe um paciente com este email.");
        }

        AuthResponse authResponse = authClient.register(
                new AuthRequest(normalizedEmail, request.getNome().trim(), "patient"));

        try {
            Patient patient = Patient.builder()
                    .email(normalizedEmail)
                    .userAuthId(authResponse.authUserId())
                    .nome(request.getNome().trim())
                    .telefone(request.getTelefone().trim())
                    .dataNascimento(request.getDataNascimento())
                    .genero(request.getGenero().trim())
                    .isActive(true)
                    .build();

            Patient saved = repository.saveAndFlush(patient);

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
    public List<PatientResponse> listarTodos() {
        return repository.findAllByIsActiveTrue()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PatientResponse buscarPorId(UUID id) {
        return toResponse(getActivePatient(id));
    }

    @Transactional(readOnly = true)
    public PatientResponse buscarPorEmail(String email) {
        Patient patient = repository.findByEmailAndIsActiveTrue(normalizeEmail(email))
                .orElseThrow(() -> new ResourceNotFoundException("Paciente nao encontrado."));
        return toResponse(patient);
    }

    @Transactional
    public PatientResponse atualizar(UUID id, PatientUpdateRequest request) {
        Patient patient = getActivePatient(id);

        if (request.nome() != null) {
            patient.setNome(request.nome().trim());
        }
        if (request.telefone() != null) {
            patient.setTelefone(request.telefone().trim());
        }
        if (request.dataNascimento() != null) {
            patient.setDataNascimento(request.dataNascimento());
        }
        if (request.genero() != null) {
            patient.setGenero(request.genero().trim());
        }
        if (request.email() != null) {
            String normalizedEmail = normalizeEmail(request.email());
            if (repository.existsByEmailAndIdNot(normalizedEmail, id)) {
                throw new ConflictException("Ja existe um paciente com este email.");
            }
            patient.setEmail(normalizedEmail);
            repository.saveAndFlush(patient);
            authClient.updateEmail(UUID.fromString(patient.getUserAuthId()), new UpdateUserEmailRequest(normalizedEmail));
            return toResponse(patient);
        }

        return toResponse(repository.save(patient));
    }

    @Transactional
    public void deletar(UUID id) {
        Patient patient = getActivePatient(id);
        patient.setIsActive(false);
        repository.saveAndFlush(patient);
        authClient.deactivateAccount(UUID.fromString(patient.getUserAuthId()));
    }

    private Patient getActivePatient(UUID id) {
        return repository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente nao encontrado."));
    }

    private PatientResponse toResponse(Patient patient) {
        return new PatientResponse(
                patient.getId(),
                patient.getNome(),
                patient.getEmail(),
                patient.getDataNascimento(),
                patient.getGenero(),
                patient.getTelefone(),
                patient.getIsActive());
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }
}
