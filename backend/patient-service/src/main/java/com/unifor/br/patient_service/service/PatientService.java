package com.unifor.br.patient_service.service;

import org.springframework.stereotype.Service;

import com.unifor.br.patient_service.client.AuthClient;
import com.unifor.br.patient_service.client.AuthRequest;
import com.unifor.br.patient_service.client.AuthResponse;
import com.unifor.br.patient_service.dto.PatientRequest;
import com.unifor.br.patient_service.model.Patient;
import com.unifor.br.patient_service.repository.PatientRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository repository;
    private final AuthClient authClient;
    private final EmailService emailService;

    public void registrar(PatientRequest request) {
        // 1. cria usuário no auth service
        AuthResponse authResponse = authClient.register(
            new AuthRequest(request.getEmail(), request.getNome())
        );

        // 2. cria paciente
        Patient patient = Patient.builder()
                .email(request.getEmail())
                .userAuthId(authResponse.authUserId())
                .nome(request.getNome())
                .telefone(request.getTelefone())
                .dataNascimento(request.getDataNascimento())
                .isActive(true)
                .build();
    

        repository.save(patient);
        // 3. envia email com senha temporária
        emailService.enviarEmail(
            request.getEmail(),
            "Bem-vindo ao SGH",request.getNome(),
            "Sua senha temporária é: " + authResponse.senha()
        );

}
}
