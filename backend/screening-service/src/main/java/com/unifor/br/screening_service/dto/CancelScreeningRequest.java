package com.unifor.br.screening_service.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CancelScreeningRequest(
        @NotNull(message = "O ID do profissional e obrigatorio.")
        UUID professionalId,
        @NotBlank(message = "O motivo do cancelamento e obrigatorio.")
        String reason,
        boolean absent) {
}
