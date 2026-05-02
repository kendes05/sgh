package com.unifor.br.medical_records_service.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record MedicationResponse(
        UUID id,
        String nomeMedicamento,
        String dosagem,
        String duracaoTratamento,
        String observacoes,
        LocalDate dataInicio,
        LocalDateTime prescritoEm) {
}
