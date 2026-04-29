package com.unifor.br.doctor_service.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.unifor.br.doctor_service.client.AuthClient;
import com.unifor.br.doctor_service.client.AuthRequest;
import com.unifor.br.doctor_service.client.AuthResponse;
import com.unifor.br.doctor_service.dto.DoctorRequest;
import com.unifor.br.doctor_service.dto.DoctorResponse;
import com.unifor.br.doctor_service.model.Doctor;
import com.unifor.br.doctor_service.model.Doctor.Role;
import com.unifor.br.doctor_service.repository.DoctorRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DoctorService {
    
    private final DoctorRepository repository;
    private final AuthClient authClient;
    private final EmailService emailService;

    public DoctorResponse registerDoctor(DoctorRequest request) {
        // 1. Verifica se já existe médico com o e-mail
        if (repository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Já existe um médico com este e-mail");
        }
 
        // 2. Cria usuário no serviço de Auth
        AuthResponse authResponse = authClient.register(
            new AuthRequest(request.getEmail(), request.getNome(), "medic")
        );

        String roleDoctorModal = request.getRole().toLowerCase();
 
        // 3. Persiste o médico com o authUserId retornado
        Doctor doctor = Doctor.builder()
                .email(request.getEmail())
                .userAuthId(authResponse.authUserId())
                .nome(request.getNome())
                .telefone(request.getTelefone())
                .sexo(request.getSexo())
                .especialidadePrincipal(request.getEspecialidadePrincipal())
                .crm_coren(request.getCrm_coren())
                .role(Role.valueOf(roleDoctorModal))
                .build();
 
        repository.save(doctor);
 
        // 4. Envia e-mail com senha temporária
        emailService.enviarEmail(
            request.getEmail(),
            "Bem-vindo ao SGH",
            request.getNome(),
            "Sua senha temporária é: " + authResponse.senha()
        );
 
        return toResponse(doctor);
    }


    public List<DoctorResponse> listDoctors() {
        return repository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public List<DoctorResponse> getDoctorsByRole(String role) {
        return repository.findByRole(Role.valueOf(role.toLowerCase())).stream()
                .map(this::toResponse)
                .toList();
    }

    public DoctorResponse getDoctorById(String id) {
        Doctor doctor = repository.findById(UUID.fromString(id))
                .orElseThrow(() -> new RuntimeException("Médico não encontrado"));
        return toResponse(doctor);
    }

    public DoctorResponse updateDoctor(String id, DoctorRequest request) {
        Doctor doctor = repository.findById(UUID.fromString(id))
                .orElseThrow(() -> new RuntimeException("Médico não encontrado"));

        if (request.getNome() != null) doctor.setNome(request.getNome());
        if (request.getCrm_coren() != null) doctor.setCrm_coren(request.getCrm_coren());
        if (request.getSexo() != null) doctor.setSexo(request.getSexo());
        if (request.getEmail() != null) doctor.setEmail(request.getEmail());
        if (request.getTelefone() != null) doctor.setTelefone(request.getTelefone());
        if (request.getEspecialidadePrincipal() != null) doctor.setEspecialidadePrincipal(request.getEspecialidadePrincipal());

        repository.save(doctor);
        return toResponse(doctor);
    }

    public void deleteDoctor(String id) {
        Doctor doctor = repository.findById(UUID.fromString(id))
                .orElseThrow(() -> new RuntimeException("Médico não encontrado"));
        repository.delete(doctor);
    }


    private DoctorResponse toResponse(Doctor doctor) {
        DoctorResponse response = new DoctorResponse();
        response.setId(doctor.getId());
        response.setNome(doctor.getNome());
        response.setCrm_coren(doctor.getCrm_coren());
        response.setSexo(doctor.getSexo());
        response.setEmail(doctor.getEmail());
        response.setTelefone(doctor.getTelefone());
        response.setEspecialidadePrincipal(doctor.getEspecialidadePrincipal());
        response.setRole(doctor.getRole().toString().toLowerCase());
        return response;
    }

}
