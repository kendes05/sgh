package com.unifor.br.medical_records_service.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;

public record CreateMedicationRequest(
        @NotBlank(message = "nomeMedicamento e obrigatorio")
        String nomeMedicamento,
        @NotBlank(message = "dosagem e obrigatorio")
        String dosagem,
        @NotBlank(message = "duracaoTratamento e obrigatorio")
        String duracaoTratamento,
        String observacoes,
        LocalDate dataInicio) {
}
