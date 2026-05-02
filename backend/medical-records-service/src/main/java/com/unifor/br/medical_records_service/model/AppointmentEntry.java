package com.unifor.br.medical_records_service.model;

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
public class AppointmentEntry {

    private UUID id;
    private LocalDateTime appointmentDate;
    private UUID professionalId;
    private String professionalName;
    private AppointmentType appointmentType;
    private String clinicalNotes;
    private LocalDateTime createdAt;
}
