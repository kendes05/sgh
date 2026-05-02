package com.unifor.br.medical_records_service.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.unifor.br.medical_records_service.model.AppointmentType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateAppointmentRequest(
        @NotNull(message = "dataAtendimento e obrigatoria")
        LocalDateTime dataAtendimento,
        @NotNull(message = "idProfissional e obrigatorio")
        UUID idProfissional,
        @NotNull(message = "tipoAtendimento e obrigatorio")
        AppointmentType tipoAtendimento,
        @NotBlank(message = "observacoesClinicas e obrigatorio")
        String observacoesClinicas) {
}
