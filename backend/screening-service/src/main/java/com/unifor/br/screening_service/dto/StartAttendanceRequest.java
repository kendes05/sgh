package com.unifor.br.screening_service.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record StartAttendanceRequest(
        @NotNull(message = "O ID do profissional e obrigatorio.")
        UUID professionalId) {
}
