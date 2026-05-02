package com.unifor.br.medical_records_service.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicationEntry {

    private UUID id;
    private String medicationName;
    private String dosage;
    private String treatmentDuration;
    private String notes;
    private LocalDate startDate;
    private LocalDateTime prescribedAt;
}
