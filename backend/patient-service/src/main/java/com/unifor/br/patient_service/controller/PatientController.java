package com.unifor.br.patient_service.controller;



import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.unifor.br.patient_service.dto.PatientRequest;
import com.unifor.br.patient_service.service.PatientService;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;


@RestController
@RequestMapping("/patient")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;

    @PostMapping
    public ResponseEntity<?> registrar(@RequestBody PatientRequest request) {
        System.out.println("Registrando paciente: " + request);
        patientService.registrar(request);
        return ResponseEntity.ok(Map.of("message", "Paciente registrado com sucesso"));
    }

    @GetMapping
    public String getMethodName() {
        return "Hello World";
    }
    


}