package com.unifor.br.screening_service.dto;

import java.util.UUID;

import com.unifor.br.screening_service.model.PriorityLevel;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ValidateClassificationRequest(
        @NotNull UUID professionalId,
        PriorityLevel finalPriority,
        @Size(max = 1500) String overrideJustification) {
}
