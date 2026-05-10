package com.unifor.br.screening_service.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record FinishScreeningRequest(
        @NotNull(message = "O ID do profissional e obrigatorio.")
        UUID professionalId,
        String dischargeNotes) {
}
