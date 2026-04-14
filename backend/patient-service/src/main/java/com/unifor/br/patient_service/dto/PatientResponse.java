package com.unifor.br.patient_service.dto;

import java.time.LocalDate;
import java.util.UUID;

public record PatientResponse(
    UUID id,
    String nome,
    String email,
    LocalDate dataNascimento,
    String genero,
    String telefone,
    boolean isActive
) {}