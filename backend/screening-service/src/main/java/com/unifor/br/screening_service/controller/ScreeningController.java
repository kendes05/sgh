package com.unifor.br.screening_service.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.unifor.br.screening_service.dto.ClassificationSuggestionResponse;
import com.unifor.br.screening_service.dto.CreateScreeningRequest;
import com.unifor.br.screening_service.dto.RouteScreeningRequest;
import com.unifor.br.screening_service.dto.ScreeningResponse;
import com.unifor.br.screening_service.dto.ValidateClassificationRequest;
import com.unifor.br.screening_service.model.ScreeningStatus;
import com.unifor.br.screening_service.service.ScreeningService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/screenings")
@RequiredArgsConstructor
public class ScreeningController {

    private final ScreeningService screeningService;

    @PostMapping
    public ResponseEntity<ScreeningResponse> create(@RequestBody @Valid CreateScreeningRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(screeningService.create(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ScreeningResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(screeningService.findById(id));
    }

    @GetMapping("/hello")
    public String hello() {
        return "Hello, Screening Service!";
    }

    @GetMapping
    public ResponseEntity<List<ScreeningResponse>> list(
            @RequestParam(required = false) ScreeningStatus status,
            @RequestParam(required = false) UUID patientId) {
        return ResponseEntity.ok(screeningService.list(status, patientId));
    }

    @GetMapping("/active/patient/{patientId}")
    public ResponseEntity<ScreeningResponse> findActiveByPatient(@PathVariable UUID patientId) {
        return ResponseEntity.ok(screeningService.findActiveByPatient(patientId));
    }

    @PostMapping("/{id}/classification/suggestion")
    public ResponseEntity<ClassificationSuggestionResponse> suggestClassification(@PathVariable UUID id) {
        return ResponseEntity.ok(screeningService.suggestClassification(id));
    }

    @PostMapping("/{id}/classification")
    public ResponseEntity<ScreeningResponse> validateClassification(
            @PathVariable UUID id,
            @RequestBody @Valid ValidateClassificationRequest request) {
        return ResponseEntity.ok(screeningService.validateClassification(id, request));
    }

    @PostMapping("/{id}/routing")
    public ResponseEntity<ScreeningResponse> route(
            @PathVariable UUID id,
            @RequestBody @Valid RouteScreeningRequest request) {
        return ResponseEntity.ok(screeningService.route(id, request));
    }
}
