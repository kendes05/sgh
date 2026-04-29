package com.unifor.br.screening_service.dto;

import java.util.UUID;

import com.unifor.br.screening_service.model.DestinationSector;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RouteScreeningRequest(
        @NotNull UUID professionalId,
        DestinationSector destinationSector,
        @Size(max = 1500) String routingNotes) {
}
