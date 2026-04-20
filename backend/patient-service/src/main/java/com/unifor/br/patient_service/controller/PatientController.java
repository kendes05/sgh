package com.unifor.br.patient_service.controller;



import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.unifor.br.patient_service.dto.PatientRequest;
import com.unifor.br.patient_service.dto.PatientUpdateRequest;
import com.unifor.br.patient_service.service.PatientService;

import jakarta.validation.Valid;

import java.util.UUID;


@RestController
@RequestMapping("/patient")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;

    // POST /pacientes — cadastro de novo paciente
    @PostMapping
    public ResponseEntity<?> cadastrar(@RequestBody @Valid PatientRequest request) {
        return ResponseEntity.status(201).body(patientService.registrar(request));
    }

    // GET /pacientes — listagem de todos os pacientes
    @GetMapping
    public ResponseEntity<?> listar() {
        return ResponseEntity.ok(patientService.listarTodos());
    }

    // GET /pacientes/{email} — busca por email
    @GetMapping("/{email}")
    public ResponseEntity<?> buscarPorEmail(@PathVariable String email) {
        return ResponseEntity.ok(patientService.buscarPorEmail(email));
    }

    // PUT /pacientes/{id} — atualização dos dados
    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(
            @PathVariable UUID id,
            @RequestBody @Valid PatientUpdateRequest request) {
        return ResponseEntity.ok(patientService.atualizar(id, request));
    }

    @DeleteMapping("/{email}")
    public ResponseEntity<?> deletar(@PathVariable String email) {
        patientService.deletar(email);
        return ResponseEntity.noContent().build();
    }


    @GetMapping("/hello")
    public String getMethodName() {
        return "Hello World";
    }
    


}