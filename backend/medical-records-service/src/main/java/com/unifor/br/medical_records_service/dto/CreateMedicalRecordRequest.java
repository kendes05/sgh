package com.unifor.br.medical_records_service.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record CreateMedicalRecordRequest(
        @NotNull(message = "idPaciente e obrigatorio")
        UUID idPaciente) {
}
