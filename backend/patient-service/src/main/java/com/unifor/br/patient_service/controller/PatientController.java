package com.unifor.br.patient_service.controller;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.unifor.br.patient_service.dto.PatientRequest;
import com.unifor.br.patient_service.dto.PatientStatsResponse;
import com.unifor.br.patient_service.dto.PatientUpdateRequest;
import com.unifor.br.patient_service.service.PatientService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;

    @PostMapping
    public ResponseEntity<?> cadastrar(@RequestBody @Valid PatientRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(patientService.registrar(request));
    }

    @GetMapping
    public ResponseEntity<?> listar(@RequestParam(required = false) String email) {
        if (email != null && !email.isBlank()) {
            return ResponseEntity.ok(patientService.buscarPorEmail(email));
        }
        return ResponseEntity.ok(patientService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(patientService.buscarPorId(id));
    }

    @GetMapping("/cpf/{cpf}")
    public ResponseEntity<?> buscarPorCpf(@PathVariable String cpf) {
        return ResponseEntity.ok(patientService.buscarPorCpf(cpf));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(
            @PathVariable UUID id,
            @RequestBody @Valid PatientUpdateRequest request) {
        return ResponseEntity.ok(patientService.atualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletar(@PathVariable UUID id) {
        patientService.deletar(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Retorna estatísticas de pacientes: total ativos e cadastros no mês corrente.
     */
    @GetMapping("/stats")
    public ResponseEntity<PatientStatsResponse> getStats() {
        return ResponseEntity.ok(patientService.getStats());
    }
}
