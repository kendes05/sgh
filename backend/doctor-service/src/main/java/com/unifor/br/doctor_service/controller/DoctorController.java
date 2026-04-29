package com.unifor.br.doctor_service.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.unifor.br.doctor_service.dto.DoctorRequest;
import com.unifor.br.doctor_service.dto.DoctorResponse;
import com.unifor.br.doctor_service.service.DoctorService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/doctor")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService doctorService;


    // GET /doctor — listagem de todos os profissionais de saúde
    @GetMapping
    public List<DoctorResponse> listDoctors() {
        return doctorService.listDoctors();
    }

    // GET /doctor/{id} — busca por id
    @GetMapping("/{id}")
    public DoctorResponse getDoctorById(@PathVariable String id) {
        return doctorService.getDoctorById(id);
    }

    // GET /doctor/role/{role} — filtrar pela Role
    @GetMapping("/role/{role}")
    public List<DoctorResponse> getDoctorsByRole(@PathVariable String role) {
        return doctorService.getDoctorsByRole(role);
    }


    // Post /doctor — cadastro de novo profissional de saúde (médico, enfermeiro)
    @PostMapping
    public DoctorResponse registerDoctor(@RequestBody DoctorRequest request) {
        return doctorService.registerDoctor(request);
    }

    // Put /doctor/{id}
    @PutMapping("/{id}")
    public DoctorResponse updateDoctor(@PathVariable String id, @RequestBody DoctorRequest request) {
        return doctorService.updateDoctor(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDoctor(@PathVariable String id) {
        doctorService.deleteDoctor(id);
        return ResponseEntity.noContent().build();
    }

}
