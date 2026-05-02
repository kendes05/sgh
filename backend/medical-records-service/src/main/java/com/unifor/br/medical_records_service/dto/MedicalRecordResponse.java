package com.unifor.br.medical_records_service.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record MedicalRecordResponse(
        String id,
        UUID idPaciente,
        String nomePaciente,
        LocalDate dataNascimentoPaciente,
        String emailPaciente,
        Boolean ativo,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm,
        List<AppointmentResponse> atendimentos,
        List<MedicationResponse> medicamentos,
        List<ExamResponse> exames,
        List<TimelineItemResponse> historicoConsolidado) {
}
