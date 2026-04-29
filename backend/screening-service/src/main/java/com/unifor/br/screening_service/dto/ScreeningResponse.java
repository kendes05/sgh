package com.unifor.br.screening_service.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.unifor.br.screening_service.model.DestinationSector;
import com.unifor.br.screening_service.model.PriorityLevel;
import com.unifor.br.screening_service.model.ScreeningStatus;
import com.unifor.br.screening_service.model.SinaisVitais;
import com.unifor.br.screening_service.model.StructuredSymptom;

public record ScreeningResponse(
        UUID id,
        UUID patientId,
        String patientName,
        LocalDate patientBirthDate,
        String susCardNumber,
        String medicalRecordNumber,
        UUID triageProfessionalId,
        UUID classificationProfessionalId,
        UUID routingProfessionalId,
        String mainComplaint,
        List<StructuredSymptom> symptoms,
        String complementarySymptoms,
        List<String> allergies,
        List<String> medicationsInUse,
        List<String> comorbidities,
        String generalNotes,
        SinaisVitais vitalSigns,
        ScreeningStatus status,
        PriorityLevel suggestedPriority,
        PriorityLevel finalPriority,
        Integer classificationScore,
        String protocol,
        String suggestedPriorityReason,
        String overrideJustification,
        LocalDateTime classifiedAt,
        DestinationSector destinationSector,
        String routingNotes,
        LocalDateTime routedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        QueueMetricsResponse queueMetrics) {
}
