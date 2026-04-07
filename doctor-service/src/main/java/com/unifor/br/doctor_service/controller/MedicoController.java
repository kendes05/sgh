package com.unifor.br.doctor_service.controller;

import com.unifor.br.doctor_service.dto.MedicoRequest;
import com.unifor.br.doctor_service.dto.MedicoResponse;
import com.unifor.br.doctor_service.dto.MedicoUpdateRequest;
import com.unifor.br.doctor_service.service.MedicoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/medicos")
@RequiredArgsConstructor
public class MedicoController {

    private final MedicoService medicoService;

    // POST /medicos — apenas admin cadastra médico
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MedicoResponse> cadastrar(@Valid @RequestBody MedicoRequest request) {
        return ResponseEntity.status(201).body(medicoService.cadastrar(request));
    }

    // GET /medicos — qualquer usuário autenticado lista médicos ativos
    @GetMapping
    public ResponseEntity<List<MedicoResponse>> listar() {
        return ResponseEntity.ok(medicoService.listarAtivos());
    }

    // GET /medicos/{id}
    @GetMapping("/{id}")
    public ResponseEntity<MedicoResponse> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(medicoService.buscarPorId(id));
    }

    // GET /medicos/especialidade/{especialidade}
    @GetMapping("/especialidade/{especialidade}")
    public ResponseEntity<List<MedicoResponse>> buscarPorEspecialidade(@PathVariable String especialidade) {
        return ResponseEntity.ok(medicoService.buscarPorEspecialidade(especialidade));
    }

    // PUT /medicos/{id} — admin ou o próprio médico
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO')")
    public ResponseEntity<MedicoResponse> atualizar(
            @PathVariable Long id,
            @RequestBody MedicoUpdateRequest request) {
        return ResponseEntity.ok(medicoService.atualizar(id, request));
    }

    // PATCH /medicos/{id}/desativar — apenas admin
    @PatchMapping("/{id}/desativar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> desativar(@PathVariable Long id) {
        medicoService.desativar(id);
        return ResponseEntity.noContent().build();
    }

    // PATCH /medicos/{id}/reativar — apenas admin
    @PatchMapping("/{id}/reativar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> reativar(@PathVariable Long id) {
        medicoService.reativar(id);
        return ResponseEntity.noContent().build();
    }
}
