package com.unifor.br.medical_records_service.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "medical_records")
public class MedicalRecord {

    @Id
    private String id;

    @Indexed(unique = true)
    private UUID patientId;

    private String patientName;
    private LocalDate patientBirthDate;
    private String patientEmail;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Builder.Default
    private List<AppointmentEntry> appointments = new ArrayList<>();

    @Builder.Default
    private List<MedicationEntry> medications = new ArrayList<>();

    @Builder.Default
    private List<ExamEntry> exams = new ArrayList<>();
}
