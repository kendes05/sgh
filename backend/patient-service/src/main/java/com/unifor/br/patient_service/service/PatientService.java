package com.unifor.br.patient_service.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.unifor.br.patient_service.client.AuthClient;
import com.unifor.br.patient_service.client.AuthRequest;
import com.unifor.br.patient_service.client.AuthResponse;
import com.unifor.br.patient_service.dto.PatientRequest;
import com.unifor.br.patient_service.dto.PatientResponse;
import com.unifor.br.patient_service.dto.PatientUpdateRequest;
import com.unifor.br.patient_service.model.Patient;
import com.unifor.br.patient_service.repository.PatientRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository repository;
    private final AuthClient authClient;
    private final EmailService emailService;

     
    public PatientResponse registrar(PatientRequest request) {
        // 1. Verifica se já existe paciente com o e-mail
        if (repository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Já existe um paciente com este e-mail");
        }
 
        // 2. Cria usuário no serviço de Auth
        AuthResponse authResponse = authClient.register(
            new AuthRequest(request.getEmail(), request.getNome(), "PATIENT")
        );
 
        // 3. Persiste o paciente com o authUserId retornado
        Patient patient = Patient.builder()
                .email(request.getEmail())
                .userAuthId(authResponse.authUserId())
                .nome(request.getNome())
                .telefone(request.getTelefone())
                .dataNascimento(request.getDataNascimento())
                .genero(request.getGenero())
                .isActive(true)
                .build();
 
        repository.save(patient);
 
        // 4. Envia e-mail com senha temporária
        emailService.enviarEmail(
            request.getEmail(),
            "Bem-vindo ao SGH",
            request.getNome(),
            "Sua senha temporária é: " + authResponse.senha()
        );
 
        return toResponse(patient);
    }

    public List<PatientResponse> listarTodos() {
        return repository.findAllByIsActiveTrue()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public PatientResponse buscarPorId(UUID id) {
        Patient patient = repository.findByIdAndIsActiveTrue(id);
        return toResponse(patient);
    }

    public PatientResponse buscarPorEmail(String email) {
        Patient patient = repository.findByEmailAndIsActiveTrue(email);
        return toResponse(patient);
    }

    public PatientResponse atualizar(UUID id, PatientUpdateRequest request) {
        Patient patient = repository.findByIdAndIsActiveTrue(id);
 
        // Atualiza apenas os campos que vieram preenchidos
        if (request.nome() != null)           patient.setNome(request.nome());
        if (request.email() != null)          patient.setEmail(request.email());
        if (request.telefone() != null)       patient.setTelefone(request.telefone());
        if (request.dataNascimento() != null) patient.setDataNascimento(request.dataNascimento());
        if (request.genero() != null)         patient.setGenero(request.genero());
 
        repository.save(patient);
        return toResponse(patient);
    }

    public void desativar(UUID id) {
        Patient patient = repository.findByIdAndIsActiveTrue(id);
        patient.setIsActive(false);
        repository.save(patient);
    }

 
    private PatientResponse toResponse(Patient patient) {
        return new PatientResponse(
            patient.getId(),
            patient.getNome(),
            patient.getEmail(),
            patient.getDataNascimento(),
            patient.getGenero(),
            patient.getTelefone(),
            patient.getIsActive()
        );
    }

    
    
}
