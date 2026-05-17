package com.unifor.br.medical_records_service.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.unifor.br.medical_records_service.dto.AppointmentResponse;
import com.unifor.br.medical_records_service.dto.CreateAppointmentRequest;
import com.unifor.br.medical_records_service.dto.CreateExamRequest;
import com.unifor.br.medical_records_service.dto.CreateMedicalRecordRequest;
import com.unifor.br.medical_records_service.dto.CreateMedicationRequest;
import com.unifor.br.medical_records_service.dto.ExamResponse;
import com.unifor.br.medical_records_service.dto.MedicalRecordResponse;
import com.unifor.br.medical_records_service.dto.MedicationResponse;
import com.unifor.br.medical_records_service.dto.TimelineItemResponse;
import com.unifor.br.medical_records_service.service.MedicalRecordService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/medical-records")
@RequiredArgsConstructor
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    @PostMapping
    public ResponseEntity<MedicalRecordResponse> create(@RequestBody @Valid CreateMedicalRecordRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(medicalRecordService.create(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MedicalRecordResponse> findById(@PathVariable String id) {
        return ResponseEntity.ok(medicalRecordService.findById(id));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<MedicalRecordResponse> findByPatientId(@PathVariable UUID patientId) {
        return ResponseEntity.ok(medicalRecordService.findByPatientId(patientId));
    }

    @PostMapping("/{id}/appointments")
    @PreAuthorize("hasRole('MEDIC')")
    public ResponseEntity<AppointmentResponse> addAppointment(
            @PathVariable String id,
            @RequestBody @Valid CreateAppointmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(medicalRecordService.addAppointment(id, request));
    }

    @PostMapping("/{id}/medications")
    public ResponseEntity<MedicationResponse> addMedication(
            @PathVariable String id,
            @RequestBody @Valid CreateMedicationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(medicalRecordService.addMedication(id, request));
    }

    @PostMapping("/{id}/exams")
    public ResponseEntity<ExamResponse> addExam(
            @PathVariable String id,
            @RequestBody @Valid CreateExamRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(medicalRecordService.addExam(id, request));
    }

    @GetMapping("/{id}/timeline")
    public ResponseEntity<List<TimelineItemResponse>> getTimeline(@PathVariable String id) {
        return ResponseEntity.ok(medicalRecordService.getTimeline(id));
    }
}
