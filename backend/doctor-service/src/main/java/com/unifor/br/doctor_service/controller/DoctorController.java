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


    // GET /doctors — listagem de todos os médicos
    @GetMapping
    public List<DoctorResponse> listDoctors() {
        return doctorService.listDoctors();
    }

    // GET /doctors/{id} — busca por id
    @GetMapping("/{id}")
    public DoctorResponse getDoctorById(@PathVariable String id) {
        return doctorService.getDoctorById(id);
    }

    // Post /doctors — cadastro de novo médico
    @PostMapping
    public DoctorResponse registerDoctor(@RequestBody DoctorRequest request) {
        return doctorService.registerDoctor(request);
    }

    // Put /doctors/{id}
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
