package com.unifor.br.medical_records_service.client;

import java.time.LocalDate;
import java.util.UUID;

public record PatientSummaryResponse(
        UUID id,
        String nome,
        String email,
        LocalDate dataNascimento,
        String genero,
        String telefone,
        boolean isActive) {
}
