package com.unifor.br.screening_service.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.unifor.br.screening_service.model.SinaisVitais;
import com.unifor.br.screening_service.model.StructuredSymptom;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateScreeningRequest(
        @NotNull UUID patientId,
        @NotBlank @Size(max = 150) String patientName,
        @NotNull LocalDate patientBirthDate,
        @Size(max = 30) String susCardNumber,
        @Size(max = 40) String medicalRecordNumber,
        @NotNull UUID triageProfessionalId,
        @NotBlank @Size(max = 500) String mainComplaint,
        List<StructuredSymptom> symptoms,
        String complementarySymptoms,
        List<String> allergies,
        List<String> medicationsInUse,
        List<String> comorbidities,
        String generalNotes,
        @NotNull @Valid SinaisVitais vitalSigns) {
}
