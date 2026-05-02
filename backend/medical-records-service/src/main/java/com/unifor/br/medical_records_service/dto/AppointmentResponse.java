package com.unifor.br.medical_records_service.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.unifor.br.medical_records_service.model.AppointmentType;

public record AppointmentResponse(
        UUID id,
        LocalDateTime dataAtendimento,
        UUID idProfissional,
        String nomeProfissional,
        AppointmentType tipoAtendimento,
        String observacoesClinicas,
        LocalDateTime criadoEm) {
}
