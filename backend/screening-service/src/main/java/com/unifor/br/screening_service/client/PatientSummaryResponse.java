package com.unifor.br.screening_service.client;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Projeção mínima do paciente retornada pelo patient-service.
 * Usada apenas para validar existência e status ativo antes de abrir triagem.
 */
public record PatientSummaryResponse(
        UUID id,
        String nome,
        String email,
        LocalDate dataNascimento,
        String susCardNumber,
        boolean isActive) {
}
